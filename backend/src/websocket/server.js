const { WebSocketServer } = require('ws');
const { verifyWsToken } = require('../auth/middleware');
const { getLiveMetrics } = require('../metrics/collector');

const INTERVAL_MS = 2000;

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const intervals = new Map();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const user = verifyWsToken(token);

    if (!user) {
      ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    console.log(`WS connected: ${user.username}`);
    ws.send(JSON.stringify({ type: 'connected', username: user.username }));

    const push = async () => {
      if (ws.readyState !== ws.OPEN) return;
      try {
        const metrics = await getLiveMetrics();
        ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
      } catch (err) {
        console.error('Metrics error:', err.message);
      }
    };

    push();
    const interval = setInterval(push, INTERVAL_MS);
    intervals.set(ws, interval);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
      } catch {}
    });

    ws.on('close', () => {
      clearInterval(intervals.get(ws));
      intervals.delete(ws);
      console.log(`WS disconnected: ${user.username}`);
    });

    ws.on('error', () => {
      clearInterval(intervals.get(ws));
      intervals.delete(ws);
    });
  });

  return wss;
}

module.exports = { setupWebSocket };
