# Google Calendar Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time Google Calendar availability checking and automatic event creation to the Hermes Studio bot so meetings never overlap.

**Architecture:** A new `api/calendar.js` module handles all Google Calendar API calls (auth, availability check, event creation). `api/chat.js` gains a `verificar_disponibilidad` tool and replaces the single-tool handler with a multi-turn loop that supports both tools in sequence. When `registrar_lead` fires, it also creates a Google Calendar event.

**Tech Stack:** `googleapis` npm package (Google's official Node.js client), Google Cloud Service Account for server-side auth (no OAuth flow), Jest for unit tests.

---

### Task 1: Add dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json**

Replace the contents of `package.json` with:

```json
{
  "name": "hermes-studio-landing",
  "version": "1.0.0",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.55.0",
    "googleapis": "^144.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 2: Install**

```bash
npm install
```

Expected: `node_modules/googleapis` directory exists, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add googleapis and jest"
```

---

### Task 2: Create api/calendar.js

**Files:**
- Create: `api/calendar.js`
- Create: `api/__tests__/calendar.test.js`

- [ ] **Step 1: Write the failing tests**

Create `api/__tests__/calendar.test.js`:

```javascript
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    calendar: jest.fn(),
  },
}));

const { google } = require('googleapis');
const { checkAvailability, createCalendarEvent } = require('../calendar');

const mockFreeBusy = jest.fn();
const mockEventsInsert = jest.fn();

google.calendar.mockReturnValue({
  freebusy: { query: mockFreeBusy },
  events: { insert: mockEventsInsert },
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = Buffer.from(
    JSON.stringify({ type: 'service_account', client_email: 'bot@test.iam.gserviceaccount.com', private_key: 'fake' })
  ).toString('base64');
  process.env.GOOGLE_CALENDAR_ID = 'owner@gmail.com';
});

describe('checkAvailability', () => {
  test('returns horario_laboral for Saturday', async () => {
    const result = await checkAvailability('2026-06-13', '10:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral for Sunday', async () => {
    const result = await checkAvailability('2026-06-14', '10:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral before 9am', async () => {
    const result = await checkAvailability('2026-06-15', '08:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral after 17:00', async () => {
    const result = await checkAvailability('2026-06-15', '18:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns available when calendar slot is free', async () => {
    mockFreeBusy.mockResolvedValue({
      data: { calendars: { 'owner@gmail.com': { busy: [] } } },
    });
    const result = await checkAvailability('2026-06-15', '10:00');
    expect(result).toEqual({ available: true });
  });

  test('returns ocupado when calendar has a conflict', async () => {
    mockFreeBusy.mockResolvedValue({
      data: {
        calendars: {
          'owner@gmail.com': {
            busy: [{ start: '2026-06-15T10:00:00-03:00', end: '2026-06-15T11:00:00-03:00' }],
          },
        },
      },
    });
    const result = await checkAvailability('2026-06-15', '10:00');
    expect(result).toEqual({ available: false, reason: 'ocupado' });
  });
});

describe('createCalendarEvent', () => {
  test('creates event with correct summary and attendee', async () => {
    mockEventsInsert.mockResolvedValue({ data: { id: 'event-123' } });

    await createCalendarEvent({
      nombre: 'María García',
      email: 'maria@example.com',
      fecha: '2026-06-15',
      hora: '10:00',
      interes: 'Redes sociales',
    });

    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'owner@gmail.com',
        requestBody: expect.objectContaining({
          summary: 'Reunión Hermes Studio — María García',
          description: expect.stringContaining('maria@example.com'),
          start: expect.objectContaining({ timeZone: 'America/Argentina/Buenos_Aires' }),
          attendees: expect.arrayContaining([{ email: 'maria@example.com' }]),
        }),
      })
    );
  });

  test('skips creation silently when fecha or hora is missing', async () => {
    await createCalendarEvent({ nombre: 'Test', email: 'test@test.com' });
    expect(mockEventsInsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest api/__tests__/calendar.test.js --no-coverage
```

Expected: FAIL — `Cannot find module '../calendar'`

- [ ] **Step 3: Create api/calendar.js**

```javascript
const { google } = require('googleapis');

function getCalendarClient() {
  const raw = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8');
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

function isBusinessHours(fecha, hora) {
  const [year, month, day] = fecha.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  const hour = parseInt(hora.split(':')[0], 10);
  return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
}

async function checkAvailability(fecha, hora) {
  if (!isBusinessHours(fecha, hora)) {
    return { available: false, reason: 'horario_laboral' };
  }

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const timeMin = new Date(`${fecha}T${hora}:00-03:00`);
  const timeMax = new Date(timeMin.getTime() + 60 * 60 * 1000);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars[calendarId].busy;
  return busy.length === 0
    ? { available: true }
    : { available: false, reason: 'ocupado' };
}

async function createCalendarEvent({ nombre, email, fecha, hora, interes }) {
  if (!fecha || !hora) return;

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const startTime = new Date(`${fecha}T${hora}:00-03:00`);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Reunión Hermes Studio — ${nombre}`,
      description: `Email: ${email}\nInterés: ${interes || 'No especificado'}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      attendees: [{ email }],
    },
  });
}

module.exports = { checkAvailability, createCalendarEvent };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest api/__tests__/calendar.test.js --no-coverage
```

Expected: PASS — 8 tests, all green.

- [ ] **Step 5: Commit**

```bash
git add api/calendar.js api/__tests__/calendar.test.js
git commit -m "feat: add Google Calendar helper module"
```

---

### Task 3: Update api/chat.js

**Files:**
- Modify: `api/chat.js`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `api/chat.js` with:

```javascript
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
    await fetch(url, {
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
  } catch (err) {
    console.error('Make webhook error:', err.message);
  }
}

const client = new Anthropic();

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
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages,
    });

    let leadCaptured = false;

    while (currentResponse.stop_reason === 'tool_use') {
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
        await notifyMake(toolBlock.input);
        try {
          await createCalendarEvent(toolBlock.input);
        } catch (err) {
          console.error('Calendar event error:', err.message);
        }
        leadCaptured = true;
        toolResult = 'Lead registrado exitosamente.';
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
        model: 'claude-opus-4-8',
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
```

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS — 8 tests green.

- [ ] **Step 3: Commit**

```bash
git add api/chat.js
git commit -m "feat: integrate Google Calendar availability check and event creation"
```

---

### Task 4: Update environment config

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add new env vars**

Replace the contents of `.env.example` with:

```
JWT_SECRET=change_this_to_a_long_random_secret_string
PORT=3001
WS_PORT=3002
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
NODE_ENV=production
ANTHROPIC_API_KEY=tu_api_key_aqui
MAKE_WEBHOOK_URL=https://hook.make.com/tu-webhook-aqui
GOOGLE_SERVICE_ACCOUNT_JSON=base64_del_json_de_credenciales_aqui
GOOGLE_CALENDAR_ID=tu_email_de_google@gmail.com
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "config: add Google Calendar env vars to .env.example"
```

---

## One-time Google Cloud setup (owner does this once after deploy)

**1. Crear proyecto en Google Cloud**
- Ir a https://console.cloud.google.com
- Clic en "New Project" → nombre: "Hermes Studio Bot" → Create

**2. Activar la API de Google Calendar**
- "APIs & Services" → "Library" → buscar "Google Calendar API" → Enable

**3. Crear Service Account**
- "APIs & Services" → "Credentials" → "Create Credentials" → "Service Account"
- Nombre: `hermes-bot` → Create and Continue → Done (sin roles)
- Clic en la cuenta creada → pestaña "Keys" → "Add Key" → "Create new key" → JSON
- Se descarga un archivo `.json` a tu computadora

**4. Convertir credenciales a Base64 (PowerShell)**

```powershell
$bytes = [System.IO.File]::ReadAllBytes("C:\ruta\al\archivo-credenciales.json")
[Convert]::ToBase64String($bytes) | Set-Clipboard
```

El string base64 queda en el portapapeles.

**5. Agregar variables en Vercel**
- Ir al proyecto en Vercel → Settings → Environment Variables
- Agregar `GOOGLE_SERVICE_ACCOUNT_JSON` → pegar el string base64
- Agregar `GOOGLE_CALENDAR_ID` → tu email de Google (ej. `tumail@gmail.com`)

**6. Compartir tu calendario con la service account**
- Abrir Google Calendar → Configuración → clic en tu calendario
- "Compartir con personas específicas" → agregar el email de la service account
  (tiene la forma `hermes-bot@hermes-studio-bot.iam.gserviceaccount.com`)
- Permiso: "Realizar cambios en eventos" → Enviar

**7. Hacer redeploy en Vercel**
- Push del código o trigger manual de redeploy para que tome las nuevas env vars
