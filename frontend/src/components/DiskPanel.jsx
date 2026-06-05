import styles from './DiskPanel.module.css';

function fmt(bytes) {
  return (bytes / 1024 ** 3).toFixed(0) + ' GB';
}

export default function DiskPanel({ disks }) {
  if (!disks?.length) return null;
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Disk Usage</h3>
      <div className={styles.list}>
        {disks.map(d => (
          <div key={d.mount} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.mount}>{d.mount}</span>
              <span className={styles.stats}>
                {fmt(d.used)} / {fmt(d.size)} · {d.usedPercent}%
              </span>
            </div>
            <div className={styles.barWrap}>
              <div
                className={styles.bar}
                style={{ width: `${d.usedPercent}%` }}
                data-warn={d.usedPercent > 80}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
