const express = require('express');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();

const ALLOWED_ORIGINS = [
  'https://hermesstudio.com.ar',
  'https://www.hermesstudio.com.ar',
];

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intentá de nuevo en una hora.' });
  },
});

function chatCors(req, res, next) {
  const origin = req.headers.origin;
  const isDev = process.env.NODE_ENV !== 'production';
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    (isDev && origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')));

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(allowed ? 204 : 403);
  }
  next();
}

const SYSTEM_PROMPT = `Sos Hermes, el asistente de inteligencia artificial de Hermes Studio, una agencia de marketing digital boutique. Respondés en español de Argentina, con un tono cálido, profesional y orientado a resultados.

Hermes Studio ofrece: gestión de redes sociales, diseño gráfico, campañas publicitarias (Meta Ads, Google Ads), email marketing, branding y estrategia digital.

Tu rol es responder consultas sobre los servicios de la agencia, orientar a potenciales clientes y agendar reuniones de diagnóstico gratuitas. Nunca inventés precios concretos — si preguntan por presupuesto, invitá a agendar una llamada. Respondés de forma breve y clara, máximo 3 párrafos.

Cuando un usuario quiere agendar una reunión o mostró interés concreto en algún servicio, pedile naturalmente su nombre, email y disponibilidad horaria. Si el usuario da un horario vago como "el martes" o "a la mañana", preguntale la fecha exacta (día y mes) antes de registrar el lead. Una vez que tenés nombre, email y fecha/horario concreto, usá la herramienta registrar_lead para guardar sus datos. Después confirmale que el equipo lo va a contactar.`;

const LEAD_TOOL = {
  name: 'registrar_lead',
  description: 'Registra los datos de un potencial cliente cuando ya tenés su nombre y email. Llamá esta herramienta una sola vez por conversación, cuando el usuario haya dado sus datos de contacto.',
  input_schema: {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Nombre completo del usuario' },
      email: { type: 'string', description: 'Email de contacto' },
      horario: { type: 'string', description: 'Disponibilidad horaria o día preferido para la reunión' },
      interes: { type: 'string', description: 'Servicio o necesidad que le interesa' },
    },
    required: ['nombre', 'email'],
  },
};

async function notifyMake(leadData) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.warn('MAKE_WEBHOOK_URL not set — lead not forwarded:', leadData);
    return;
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ...leadData,
          timestamp: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }),
    });
    if (!response.ok) console.error('Make webhook responded:', response.status);
  } catch (err) {
    console.error('Make webhook error:', err.message);
  }
}

const client = new Anthropic();

router.post('/', chatCors, chatLimiter, async (req, res) => {
  try {
    const { message, messages } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const sanitized = message.trim().slice(0, 500);
    const history = Array.isArray(messages) ? messages.slice(-10) : [];

    const messagesForApi = [
      ...history,
      { role: 'user', content: sanitized },
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [LEAD_TOOL],
      messages: messagesForApi,
    });

    if (response.stop_reason === 'tool_use') {
      const toolBlock = response.content.find(b => b.type === 'tool_use');

      await notifyMake(toolBlock.input);

      const followUp = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [LEAD_TOOL],
        messages: [
          ...messagesForApi,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: 'Lead registrado exitosamente.',
            }],
          },
        ],
      });

      const reply = followUp.content.find(b => b.type === 'text')?.text ?? '';
      return res.json({ reply, leadCaptured: true });
    }

    const reply = response.content.find(b => b.type === 'text')?.text ?? '';
    res.json({ reply });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd
      ? 'Ocurrió un error. Por favor, intentá de nuevo.'
      : err.message;
    res.status(500).json({ error: message });
  }
});

router.options('/', chatCors);

module.exports = router;
