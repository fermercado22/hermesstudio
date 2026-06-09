const Anthropic = require('@anthropic-ai/sdk');
const { checkAvailability, createCalendarEvent } = require('./calendar');

const ALLOWED_ORIGINS = [
  'https://hermesstudio.com.ar',
  'https://www.hermesstudio.com.ar',
];

const SYSTEM_PROMPT = `Sos Hermes, el asistente de inteligencia artificial de Hermes Studio, una agencia de marketing digital boutique. Respondés en español de Argentina, con un tono cálido, profesional y orientado a resultados.

Hermes Studio ofrece: gestión de redes sociales, diseño gráfico, campañas publicitarias (Meta Ads, Google Ads), email marketing, branding y estrategia digital.

Tu rol es responder consultas sobre los servicios de la agencia, orientar a potenciales clientes y agendar reuniones de diagnóstico gratuitas. Nunca inventés precios concretos — si preguntan por presupuesto, invitá a agendar una llamada. Respondés de forma breve y clara, máximo 3 párrafos.

Cuando un usuario quiere agendar una reunión o mostró interés concreto en algún servicio, pedile naturalmente su nombre, email y disponibilidad horaria. Si el usuario da un horario vago como "el martes" o "a la mañana", preguntale la fecha exacta (día y mes) antes de verificar. Solo agendás reuniones de lunes a viernes entre las 9:00 y las 18:00 hs (el último turno arranca a las 17:00). Antes de confirmar cualquier horario, siempre usá verificar_disponibilidad con la fecha en formato YYYY-MM-DD y la hora en formato HH:MM. Si el resultado indica que está ocupado o fuera del horario laboral, informalo con naturalidad y pedí otro horario. Una vez que tenés un horario disponible confirmado, nombre y email, usá registrar_lead con nombre, email, horario (texto legible), fecha (YYYY-MM-DD), hora (HH:MM) e interés. Después confirmale que el equipo lo va a contactar.`;

const LEAD_TOOL = {
  name: 'registrar_lead',
  description: 'Registra los datos de un potencial cliente cuando ya tenés su nombre, email y un horario confirmado como disponible. Llamá esta herramienta una sola vez por conversación.',
  input_schema: {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Nombre completo del usuario' },
      email: { type: 'string', description: 'Email de contacto' },
      horario: { type: 'string', description: 'Fecha y horario en texto legible, ej: "lunes 15 de junio a las 10:00"' },
      fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD para crear el evento en el calendario' },
      hora: { type: 'string', description: 'Hora en formato HH:MM para crear el evento en el calendario' },
      interes: { type: 'string', description: 'Servicio o necesidad que le interesa' },
    },
    required: ['nombre', 'email'],
  },
};

const AVAILABILITY_TOOL = {
  name: 'verificar_disponibilidad',
  description: 'Verifica si un horario está disponible en el calendario de Hermes Studio. Llamá esta herramienta cada vez que el usuario proponga un horario, antes de confirmarlo.',
  input_schema: {
    type: 'object',
    properties: {
      fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
      hora: { type: 'string', description: 'Hora en formato HH:MM (24 horas)' },
    },
    required: ['fecha', 'hora'],
  },
};

const TOOLS = [AVAILABILITY_TOOL, LEAD_TOOL];

async function notifyMake(leadData) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...leadData,
        timestamp: new Date().toLocaleString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
      }),
    });
    if (!response.ok) {
      throw new Error(`Make webhook returned ${response.status}`);
    }
  } catch (err) {
    console.error('Make webhook error:', err.message, { nombre: leadData.nombre, email: leadData.email });
    throw err;
  }
}

const client = new Anthropic();
const MODEL = 'claude-opus-4-8';

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = ALLOWED_ORIGINS.includes(origin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(allowed ? 204 : 403).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const { message, messages } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const sanitized = message.trim().slice(0, 500);
    const history = Array.isArray(messages) ? messages.slice(-10) : [];

    let currentMessages = [
      ...history,
      { role: 'user', content: sanitized },
    ];

    let currentResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages,
    });

    let leadCaptured = false;
    let iterations = 0;

    while (currentResponse.stop_reason === 'tool_use') {
      if (++iterations > 10) {
        console.error('Tool loop limit exceeded');
        break;
      }
      const toolBlock = currentResponse.content.find(b => b.type === 'tool_use');
      let toolResult;

      if (toolBlock.name === 'verificar_disponibilidad') {
        try {
          const { fecha, hora } = toolBlock.input;
          const availability = await checkAvailability(fecha, hora);
          if (!availability.available) {
            toolResult = availability.reason === 'horario_laboral'
              ? 'Horario fuera de rango laboral. Solo se pueden agendar reuniones de lunes a viernes de 9:00 a 18:00.'
              : 'Ese horario ya está ocupado en el calendario.';
          } else {
            toolResult = 'Horario disponible.';
          }
        } catch (err) {
          console.error('Calendar check error:', err.message);
          toolResult = 'No se pudo verificar el calendario. Asumí que el horario está disponible y continuá.';
        }
      } else if (toolBlock.name === 'registrar_lead') {
        try {
          await notifyMake(toolBlock.input);
        } catch (err) {
          console.error('Lead notification failed:', err.message);
        }
        try {
          await createCalendarEvent(toolBlock.input);
        } catch (err) {
          console.error('Calendar event error:', err.message);
        }
        leadCaptured = true;
        toolResult = 'Lead registrado exitosamente.';
      } else {
        console.error('Unknown tool called:', toolBlock.name);
        toolResult = 'Herramienta desconocida. Respondé directamente al usuario.';
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: currentResponse.content },
          {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: toolResult }],
          },
        ];
        break;
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: currentResponse.content },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: toolResult }],
        },
      ];

      currentResponse = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      });
    }

    const reply = currentResponse.content.find(b => b.type === 'text')?.text ?? '';
    return res.status(200).json({ reply, ...(leadCaptured && { leadCaptured: true }) });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: 'Ocurrió un error. Por favor, intentá de nuevo.' });
  }
};
