require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupWebSocket } = require('./websocket/server');
const { getStaticInfo } = require('./metrics/collector');
const { authenticate } = require('./auth/middleware');
const authRoutes = require('./auth/routes');
const { init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

init();

app.use('/api/auth', authRoutes);

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
