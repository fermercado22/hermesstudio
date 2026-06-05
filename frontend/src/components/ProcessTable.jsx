import styles from './ProcessTable.module.css';

export default function ProcessTable({ processes }) {
  if (!processes) return null;
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Top Processes</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>CPU %</th>
            <th>MEM %</th>
          </tr>
        </thead>
        <tbody>
          {processes.top.map(p => (
            <tr key={p.pid}>
              <td className={styles.mono}>{p.pid}</td>
              <td className={styles.name}>{p.name}</td>
              <td className={styles.mono} data-high={p.cpu > 20}>{p.cpu.toFixed(1)}</td>
              <td className={styles.mono}>{p.mem.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.footer}>{processes.total} total · {processes.running} running</p>
    </div>
  );
}
