import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Chart.module.css';

function fmtBytes(bps) {
  if (bps == null) return '0 B/s';
  if (bps > 1024 ** 2) return (bps / 1024 ** 2).toFixed(1) + ' MB/s';
  if (bps > 1024) return (bps / 1024).toFixed(1) + ' KB/s';
  return bps.toFixed(0) + ' B/s';
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtBytes(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function NetworkChart({ history }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Network I/O</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtBytes(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a4' }} />
          <Line type="monotone" dataKey="rx" name="RX" stroke="#68d391" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="tx" name="TX" stroke="#f6e05e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
