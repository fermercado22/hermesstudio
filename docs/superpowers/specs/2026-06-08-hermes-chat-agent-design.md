# Hermes Chat Agent — Design Spec

**Date:** 2026-06-08  
**Status:** Approved

---

## Overview

A floating AI chat widget on `landing/index.html` backed by a secured Express route that proxies requests to Claude (`claude-opus-4-8`). The agent presents itself as "Hermes", a digital marketing specialist for Hermes Studio.

---

## Architecture

**Deployment context:** Nginx proxies `/api/*` → backend on port 3001. The frontend widget uses a relative URL (`/api/chat`), which works without any cross-origin complexity from the browser's perspective.

**History management:** Stateless per-request. The client maintains the message array in memory and sends the last N messages with each POST. The backend slices to the last 10 before passing to Claude. No server-side session storage required.

**Response style:** Non-streaming. Claude returns a complete response per request. Appropriate for short conversational exchanges in a chat widget context.

---

## Backend — `backend/src/chat/route.js`

### Rate Limiting
`express-rate-limit`: 20 requests per IP per hour.  
Window: `60 * 60 * 1000` ms. On limit: 429 with generic JSON message.

### CORS
Custom per-route CORS middleware that restricts `Access-Control-Allow-Origin` to `hermesstudio.com.ar`. In development (`NODE_ENV !== 'production'`), also allows `localhost` origins so the feature can be tested locally. Global `cors({origin: true})` in `index.js` is not applied to this route because `app.use('/api/chat', chatRoute)` is registered after the global middleware — the route-level handler takes precedence for preflight and response headers.

### Input Validation
- Reject empty body or missing `message` field → 400
- Reject `message` that is empty string or whitespace-only → 400
- Truncate `message` to 500 characters (silent truncation, not rejection)
- Accept optional `messages[]` array (history); if absent, treat as empty

### Anthropic API Call
- Model: `claude-opus-4-8`
- Thinking: `adaptive` (default for Opus 4.8)
- History: `(messages || []).slice(-10)` — last 10 items from client-provided array
- System prompt: Hermes Studio marketing specialist persona (see below)
- `max_tokens`: 1024 (sufficient for conversational replies)

### System Prompt
```
Sos Hermes, el asistente de inteligencia artificial de Hermes Studio, una agencia de marketing digital boutique. Respondés en español de Argentina, con un tono cálido, profesional y orientado a resultados.

Hermes Studio ofrece: gestión de redes sociales, diseño gráfico, campañas publicitarias (Meta Ads, Google Ads), email marketing, branding y estrategia digital.

Tu rol es responder consultas sobre los servicios de la agencia, orientar a potenciales clientes, y agendar reuniones de diagnóstico gratuitas. Nunca inventés precios concretos — si preguntan por presupuesto, invitá a agendar una llamada. Respondés de forma breve y clara, máximo 3 párrafos.
```

### Error Handling
- `NODE_ENV === 'production'`: always return `{ error: "Ocurrió un error. Por favor, intentá de nuevo." }` with status 500.
- Development: include `err.message` in the response for debugging.

---

## Frontend — `landing/index.html`

### Widget Structure
- Floating button: bottom-right, `z-index: 1000` (above `.wa-float` which is at lower z-index)
- Colors: `#1B3A6B` (brand blue) for header and button; white/light gray for messages
- Fonts: inherits Sora/Inter already loaded on the page
- Zero external dependencies — inline `<style>` and `<script>` tags

### Behavior
- On first open: auto-display greeting message `"¡Hola! Soy Hermes 👋 ¿En qué puedo ayudarte hoy?"` as an agent bubble (does not go into the API history)
- Typing indicator: animated three-dot pulse while awaiting response
- Send on Enter key or click of send button
- Disable input during pending request to prevent double-sends
- History capped at 10 messages client-side before each request

### Data Flow
```
User types → POST /api/chat { message, messages: last10 }
           → Nginx → :3001/api/chat
           → Rate limit check → CORS → Validation → Anthropic API
           → { reply: "..." } → display in widget
```

---

## Files Changed

| File | Action |
|---|---|
| `backend/src/chat/route.js` | Create |
| `backend/src/index.js` | Register route (`app.use('/api/chat', ...)`) |
| `backend/package.json` | Add `express-rate-limit`, `@anthropic-ai/sdk` |
| `.env.example` | Add `ANTHROPIC_API_KEY=tu_api_key_aqui` |
| `landing/index.html` | Add chat widget (CSS + HTML + JS) |

Files NOT touched: auth, db, websocket, metrics.

---

## Security Checklist

- [x] API key only from `process.env.ANTHROPIC_API_KEY`, never in frontend or committed files
- [x] Rate limiting: 20 req/IP/hour
- [x] Input sanitization: max 500 chars, no empty messages
- [x] CORS restricted to `hermesstudio.com.ar` for `/api/chat`
- [x] History capped at 10 messages
- [x] Generic error messages in production

---

## Post-Deploy Setup

1. Add `ANTHROPIC_API_KEY=<real_key>` to the server's `.env`
2. Run `npm install` inside `backend/` to install new dependencies
