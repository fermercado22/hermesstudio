# Hermes Chat Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secured AI chat widget to the landing page, backed by a rate-limited Express route that proxies to Claude.

**Architecture:** Stateless per-request — the frontend holds the conversation array and sends the last 10 messages with each POST to `/api/chat`. The backend validates, rate-limits, and calls the Anthropic API. No server-side session storage.

**Tech Stack:** Node.js/Express (CommonJS), `@anthropic-ai/sdk`, `express-rate-limit`, vanilla JS widget (no external deps), Nginx proxy already in place.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/src/chat/route.js` | Rate limiting, CORS, validation, Anthropic call |
| Modify | `backend/src/index.js` | Register `/api/chat` route |
| Modify | `backend/package.json` | Add `express-rate-limit`, `@anthropic-ai/sdk` |
| Modify | `.env.example` | Document `ANTHROPIC_API_KEY` |
| Modify | `landing/index.html` | Floating chat widget (CSS + HTML + JS) |

---

## Task 1: Add dependencies and document env variable

**Files:**
- Modify: `backend/package.json`
- Modify: `.env.example`

- [ ] **Step 1: Add packages to package.json**

In `backend/package.json`, add to `"dependencies"`:

```json
{
  "name": "hermes-backend",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.55.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "express-rate-limit": "^7.4.0",
    "jsonwebtoken": "^9.0.2",
    "systeminformation": "^5.22.11",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

- [ ] **Step 2: Add ANTHROPIC_API_KEY to .env.example**

In `.env.example`, append one line at the end:

```
JWT_SECRET=change_this_to_a_long_random_secret_string
PORT=3001
WS_PORT=3002
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
NODE_ENV=production
ANTHROPIC_API_KEY=tu_api_key_aqui
```

- [ ] **Step 3: Install new dependencies**

```bash
cd backend
npm install
```

Expected: `added N packages` with no errors. `node_modules/@anthropic-ai` and `node_modules/express-rate-limit` folders should now exist.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json .env.example
git commit -m "feat: add @anthropic-ai/sdk and express-rate-limit dependencies"
```

---

## Task 2: Create the /api/chat route

**Files:**
- Create: `backend/src/chat/route.js`

- [ ] **Step 1: Create the file**

Create `backend/src/chat/route.js` with the full content below:

```js
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
```

- [ ] **Step 2: Verify syntax**

```bash
node -e "require('./backend/src/chat/route.js'); console.log('OK')"
```

Expected output: `OK` (no errors).

- [ ] **Step 3: Smoke test with curl (requires ANTHROPIC_API_KEY in .env)**

Start the backend:
```bash
cd backend && node src/index.js &
```

Test a valid request:
```bash
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, ¿qué servicios ofrecen?","messages":[]}' | cat
```
Expected: `{"reply":"..."}` with a Spanish response about Hermes Studio.

Test empty message rejection:
```bash
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"   "}' | cat
```
Expected: `{"error":"El mensaje no puede estar vacío."}` with HTTP 400.

Kill the test server after verifying: `kill %1` (or equivalent).

- [ ] **Step 4: Commit**

```bash
git add backend/src/chat/route.js
git commit -m "feat: add /api/chat route with rate limiting, CORS, and Anthropic integration"
```

---

## Task 3: Register the route in index.js

**Files:**
- Modify: `backend/src/index.js`

- [ ] **Step 1: Add require and app.use**

In `backend/src/index.js`, add after the existing `require` block and before `app.use('/api/auth', ...)`:

```js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupWebSocket } = require('./websocket/server');
const { getStaticInfo } = require('./metrics/collector');
const { authenticate } = require('./auth/middleware');
const authRoutes = require('./auth/routes');
const chatRoute = require('./chat/route');
const { init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

init();

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoute);

app.get('/api/system/info', authenticate, async (req, res) => {
  try {
    const info = await getStaticInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Hermes backend running on port ${PORT}`);
});
```

The only additions are:
- Line: `const chatRoute = require('./chat/route');`
- Line: `app.use('/api/chat', chatRoute);`

- [ ] **Step 2: Verify startup**

```bash
cd backend && node src/index.js
```

Expected: `Hermes backend running on port 3001` with no errors. Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.js
git commit -m "feat: register /api/chat route in Express app"
```

---

## Task 4: Add the floating chat widget to landing/index.html

**Files:**
- Modify: `landing/index.html`

The widget is inserted as two blocks just before `<script src="main.js"></script>` (currently line 406): a `<style>` tag with scoped CSS and a `<div>` + `<script>` tag with the widget HTML and behavior.

- [ ] **Step 1: Insert CSS block**

Insert the following `<style>` block directly before `<script src="main.js"></script>`:

```html
<style>
  /* ── Chat Widget ── */
  #hchat-btn {
    position: fixed;
    bottom: 6rem;
    right: 1.5rem;
    z-index: 1100;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #1B3A6B;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(27,58,107,.4);
    transition: transform .2s, box-shadow .2s;
  }
  #hchat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(27,58,107,.5); }
  #hchat-btn svg { pointer-events: none; }

  #hchat-panel {
    position: fixed;
    bottom: 11rem;
    right: 1.5rem;
    z-index: 1100;
    width: min(360px, calc(100vw - 3rem));
    max-height: 520px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    transition: transform .22s cubic-bezier(.4,0,.2,1), opacity .22s;
  }
  #hchat-panel.hchat--hidden { transform: scale(.85); opacity: 0; pointer-events: none; }

  .hchat__header {
    background: #1B3A6B;
    color: #fff;
    padding: .875rem 1rem;
    display: flex;
    align-items: center;
    gap: .625rem;
    flex-shrink: 0;
  }
  .hchat__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .hchat__title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: .875rem; line-height: 1.2; }
  .hchat__sub { font-size: .72rem; opacity: .75; }
  .hchat__close {
    margin-left: auto;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: .25rem;
    border-radius: 6px;
    opacity: .8;
    transition: opacity .15s;
  }
  .hchat__close:hover { opacity: 1; }

  .hchat__messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: .625rem;
    scroll-behavior: smooth;
  }
  .hchat__bubble {
    max-width: 82%;
    padding: .5rem .75rem;
    border-radius: 14px;
    font-size: .875rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .hchat__bubble--agent {
    background: #f1f4f9;
    color: #1a1a2e;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
  }
  .hchat__bubble--user {
    background: #1B3A6B;
    color: #fff;
    border-bottom-right-radius: 4px;
    align-self: flex-end;
  }

  .hchat__typing {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: .5rem .75rem;
    background: #f1f4f9;
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
    width: 48px;
  }
  .hchat__typing span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #8892a4;
    animation: hchat-dot .9s infinite;
  }
  .hchat__typing span:nth-child(2) { animation-delay: .15s; }
  .hchat__typing span:nth-child(3) { animation-delay: .3s; }
  @keyframes hchat-dot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

  .hchat__footer {
    border-top: 1px solid #e8ecf2;
    padding: .625rem;
    display: flex;
    gap: .5rem;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .hchat__input {
    flex: 1;
    border: 1.5px solid #dde2eb;
    border-radius: 10px;
    padding: .5rem .75rem;
    font-family: 'Inter', sans-serif;
    font-size: .875rem;
    resize: none;
    outline: none;
    max-height: 100px;
    overflow-y: auto;
    transition: border-color .15s;
    line-height: 1.4;
  }
  .hchat__input:focus { border-color: #1B3A6B; }
  .hchat__send {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #1B3A6B;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background .15s;
  }
  .hchat__send:hover { background: #142d55; }
  .hchat__send:disabled { background: #8892a4; cursor: not-allowed; }
  .hchat__send svg { pointer-events: none; }
</style>
```

- [ ] **Step 2: Insert widget HTML + JS block**

Insert the following block directly after the closing `</style>` tag you just added (still before `<script src="main.js"></script>`):

```html
<!-- AI Chat Widget -->
<button id="hchat-btn" aria-label="Abrir chat con Hermes" aria-expanded="false" aria-controls="hchat-panel">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
</button>

<div id="hchat-panel" class="hchat--hidden" role="dialog" aria-label="Chat con Hermes" aria-modal="true">
  <div class="hchat__header">
    <div class="hchat__avatar" aria-hidden="true">⚡</div>
    <div>
      <div class="hchat__title">Hermes</div>
      <div class="hchat__sub">Asistente de Hermes Studio</div>
    </div>
    <button class="hchat__close" id="hchat-close" aria-label="Cerrar chat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="hchat__messages" id="hchat-messages" aria-live="polite" aria-label="Mensajes del chat"></div>
  <div class="hchat__footer">
    <textarea
      id="hchat-input"
      class="hchat__input"
      placeholder="Escribí tu mensaje..."
      rows="1"
      aria-label="Escribí tu mensaje"
      maxlength="500"
    ></textarea>
    <button id="hchat-send" class="hchat__send" aria-label="Enviar mensaje">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>
</div>

<script>
(function () {
  const btn = document.getElementById('hchat-btn');
  const panel = document.getElementById('hchat-panel');
  const closeBtn = document.getElementById('hchat-close');
  const messagesEl = document.getElementById('hchat-messages');
  const input = document.getElementById('hchat-input');
  const sendBtn = document.getElementById('hchat-send');

  let isOpen = false;
  let greeted = false;
  let history = [];
  let pending = false;

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = 'hchat__bubble hchat__bubble--' + (role === 'user' ? 'user' : 'agent');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'hchat__typing';
    el.id = 'hchat-typing';
    el.setAttribute('aria-label', 'Hermes está escribiendo');
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('hchat-typing');
    if (el) el.remove();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.remove('hchat--hidden');
    btn.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      addBubble('¡Hola! Soy Hermes 👋 ¿En qué puedo ayudarte hoy?', 'agent');
    }
    setTimeout(() => input.focus(), 250);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.add('hchat--hidden');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || pending) return;

    pending = true;
    input.value = '';
    input.style.height = '';
    sendBtn.disabled = true;

    addBubble(text, 'user');
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, messages: history.slice(-10) }),
      });
      hideTyping();
      const data = await res.json();
      if (data.reply) {
        addBubble(data.reply, 'agent');
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: data.reply });
        if (history.length > 20) history = history.slice(-20);
      } else {
        addBubble(data.error || 'Error al conectar. Intentá de nuevo.', 'agent');
      }
    } catch {
      hideTyping();
      addBubble('Error al conectar. Revisá tu conexión e intentá de nuevo.', 'agent');
    }

    pending = false;
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
})();
</script>
```

- [ ] **Step 3: Visual verification**

Open `landing/index.html` in a browser (or via `npx serve landing` for a local dev server). Verify:
- A dark blue chat bubble button appears bottom-right, above the WhatsApp button
- Clicking it opens the panel with the greeting message
- Clicking the X closes it
- Pressing Escape while the panel is open closes it
- The input auto-resizes as you type multiple lines
- Sending a message shows a user bubble + typing indicator

(Full API round-trip testing requires the backend running with a real `ANTHROPIC_API_KEY`.)

- [ ] **Step 4: Commit**

```bash
git add landing/index.html
git commit -m "feat: add Hermes AI chat widget to landing page"
```

---

## Post-implementation setup instructions

After all tasks are done, tell the user:

1. **Add the API key to `.env`** (the real server environment file, not `.env.example`):
   ```
   ANTHROPIC_API_KEY=sk-ant-...your-real-key...
   ```

2. **Install new dependencies** on the server (if not done locally yet):
   ```bash
   cd backend && npm install
   ```

3. **Restart the backend** process (pm2, systemd, or however it's managed in production):
   ```bash
   pm2 restart hermes-backend
   # or
   systemctl restart hermes-backend
   ```
