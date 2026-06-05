import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(token) {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const url = `${proto}://${host}/ws?token=${token}`;

    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'metrics') setMetrics(msg.data);
    };

    ws.onclose = (e) => {
      setStatus('disconnected');
      if (e.code !== 4001) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  return { metrics, status };
}
