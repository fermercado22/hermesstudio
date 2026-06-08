# Guía: AI Chat Agent con Lead Capture

## Qué hace
Chat flotante en la landing page que responde como el asistente de la agencia, captura leads (nombre, email, fecha, interés) y los manda automáticamente a Google Sheets via Make.com.

---

## Stack
- **Frontend**: widget inline en HTML (sin dependencias externas)
- **Backend**: función serverless en Vercel (`api/chat.js`)
- **IA**: Claude `claude-opus-4-8` via `@anthropic-ai/sdk`
- **Lead capture**: Claude tool use (`registrar_lead`) → Make.com webhook → Google Sheets

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `landing/index.html` | Widget chat (CSS + HTML + JS inline, al final del body) |
| `api/chat.js` | Serverless function de Vercel — valida, llama a Claude, dispara webhook |
| `vercel.json` | Indica a Vercel que sirva `landing/` como raíz y `api/chat.js` como función |
| `package.json` (raíz) | Solo tiene `@anthropic-ai/sdk` para que Vercel lo instale |

---

## Variables de entorno en Vercel
```
ANTHROPIC_API_KEY=sk-ant-...
MAKE_WEBHOOK_URL=https://hook.us2.make.com/...
```

---

## Cómo funciona el lead capture
1. Usuario chatea y da nombre + email + fecha
2. Claude llama la herramienta `registrar_lead` con los datos estructurados
3. El backend hace POST al webhook de Make con: `nombre`, `email`, `horario`, `interes`, `timestamp`
4. Make agrega una fila al Google Sheet del cliente
5. Claude confirma al usuario que el equipo lo va a contactar

**Importante**: Claude pide fecha exacta si el usuario da un horario vago ("el martes"). Solo registra cuando tiene nombre + email + fecha concreta.

---

## Google Sheets — estructura
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Nombre | Email | Horario | Interés | Fecha y hora | Estado |

Headers en fila 1 horizontal. Make mapea A→nombre, B→email, C→horario, D→interes, E→timestamp.

---

## Make.com — configuración
1. Webhook → Custom Webhook (copiar URL → pegar en `MAKE_WEBHOOK_URL`)
2. Google Sheets → Add a Row
   - Table contains headers: ON
   - Use column headers as IDs: OFF
   - Mapeo: A=nombre, B=email, C=horario, D=interes, E=timestamp
3. Activar el escenario en modo continuo (no "Run once")

---

## Widget — comportamiento
- Se abre automáticamente a los **4 segundos** de cargar la página
- Si el usuario lo cierra manualmente, **no vuelve a abrirse** en esa sesión (sessionStorage)
- Saludo automático: `¡Hola! Soy Hermes 👋 ¿En qué puedo ayudarte hoy?`
- Enter envía, Shift+Enter hace salto de línea
- Máximo 500 caracteres por mensaje, historial de 10 mensajes

---

## Para replicar en otro cliente

### 1. Cambiar el system prompt en `api/chat.js`
```js
const SYSTEM_PROMPT = `Sos [NOMBRE_AGENTE], el asistente de [NOMBRE_EMPRESA]...
[EMPRESA] ofrece: [SERVICIOS]...`;
```

### 2. Cambiar las variables de entorno en Vercel
```
MAKE_WEBHOOK_URL=https://hook.us2.make.com/webhook-del-cliente
```

### 3. Nuevo Google Sheet para el cliente
Misma estructura de headers. En Make crear escenario nuevo apuntando al sheet del cliente.

### 4. Cambiar el saludo en `landing/index.html`
```js
addBubble('¡Hola! Soy [NOMBRE] 👋 ¿En qué puedo ayudarte hoy?', 'agent');
```

### 5. Cambiar dominio permitido en `api/chat.js`
```js
const ALLOWED_ORIGINS = [
  'https://dominio-del-cliente.com',
  'https://www.dominio-del-cliente.com',
];
```

---

## Troubleshooting frecuente

**El chat no aparece en Vercel** → El HTML viejo está cacheado. Verificar que el push llegó a GitHub y Vercel hizo deploy del commit correcto (ver código fuente → buscar `hchat`).

**Error 401 de Anthropic** → La API key tiene `sk-ant-sk-ant-` duplicado. Revisar el valor en Vercel → Settings → Environment Variables.

**Los leads no llegan al Sheet** → Make no está en modo continuo (está en "Run once"). Activar el toggle de encendido en el escenario de Make.

**Los datos llegan desalineados al Sheet** → Los headers están en columna vertical en lugar de fila horizontal. Deben estar en A1, B1, C1, D1, E1 (misma fila, columnas distintas).
