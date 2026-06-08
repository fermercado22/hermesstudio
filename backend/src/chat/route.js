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

Tu rol es responder consultas sobre los servicios de la agencia, orientar a potenciales clientes, y agendar reuniones de diagnóstico gratuitas. Nunca inventés precios concretos — si preguntan por presupuesto, invitá a agendar una llamada. Respondés de forma breve y clara, máximo 3 párrafos.`;

const client = new Anthropic();

router.post('/', chatCors, chatLimiter, async (req, res) => {
  try {
    const { message, messages } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const sanitized = message.trim().slice(0, 500);
    const history = Array.isArray(messages) ? messages.slice(-10) : [];

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...history,
        { role: 'user', content: sanitized },
      ],
    });

    const reply = response.content[0].text;
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
