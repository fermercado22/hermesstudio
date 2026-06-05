import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import MetricCard from '../components/MetricCard';
import CpuChart from '../components/CpuChart';
import MemoryChart from '../components/MemoryChart';
import NetworkChart from '../components/NetworkChart';
import ProcessTable from '../components/ProcessTable';
import DiskPanel from '../components/DiskPanel';
import styles from './Dashboard.module.css';

const MAX_HISTORY = 60;

function pushHistory(arr, value) {
  const next = [...arr, value].slice(-MAX_HISTORY);
  return next;
}

function fmtUptime(secs) {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const { metrics, status } = useWebSocket(auth?.token);

  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);
  const [netHistory, setNetHistory] = useState([]);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!metrics) return;
    const t = tickRef.current++;
    setCpuHistory(h => pushHistory(h, { t, v: metrics.cpu.load }));
    setMemHistory(h => pushHistory(h, { t, v: metrics.memory.usedPercent }));
    const net = metrics.network[0];
    setNetHistory(h => pushHistory(h, { t, rx: net?.rxSec ?? 0, tx: net?.txSec ?? 0 }));
  }, [metrics]);

  const statusColor = { connected: '#68d391', connecting: '#f6e05e', disconnected: '#fc8181' };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>Hermes</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.wsStatus}>
            <span className={styles.dot} style={{ background: statusColor[status] }} />
            {status}
          </span>
          <span className={styles.user}>{auth.user.username}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {!metrics ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Connecting to server…</p>
        </div>
      ) : (
        <main className={styles.main}>
          <div className={styles.cards}>
            <MetricCard
              title="CPU Load"
              value={metrics.cpu.load}
              unit="%"
              percent={metrics.cpu.load}
              icon="⬡"
              sub={metrics.cpu.temperature != null ? `${metrics.cpu.temperature}°C` : undefined}
            />
            <MetricCard
              title="Memory"
              value={metrics.memory.usedPercent}
              unit="%"
              percent={metrics.memory.usedPercent}
              icon="▣"
              sub={`${(metrics.memory.used / 1024 ** 3).toFixed(1)} / ${(metrics.memory.total / 1024 ** 3).toFixed(1)} GB`}
            />
            <MetricCard
              title="Processes"
              value={metrics.processes.total}
              icon="◈"
              sub={`${metrics.processes.running} running`}
            />
            <MetricCard
              title="Swap"
              value={metrics.memory.swapTotal > 0 ? ((metrics.memory.swapUsed / metrics.memory.swapTotal) * 100).toFixed(0) : 0}
              unit="%"
              percent={metrics.memory.swapTotal > 0 ? (metrics.memory.swapUsed / metrics.memory.swapTotal) * 100 : 0}
              icon="⇄"
              sub={`${(metrics.memory.swapUsed / 1024 ** 3).toFixed(1)} GB used`}
            />
          </div>

          <div className={styles.charts}>
            <CpuChart history={cpuHistory} />
            <MemoryChart history={memHistory} current={metrics.memory} />
            <NetworkChart history={netHistory} />
          </div>

          <div className={styles.bottom}>
            <ProcessTable processes={metrics.processes} />
            <DiskPanel disks={metrics.disks} />
          </div>
        </main>
      )}
    </div>
  );
}
