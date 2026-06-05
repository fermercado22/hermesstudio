import styles from './MetricCard.module.css';

function getStatusClass(value, warn = 70, crit = 90) {
  if (value >= crit) return styles.critical;
  if (value >= warn) return styles.warning;
  return styles.normal;
}

export default function MetricCard({ title, value, unit, percent, icon, sub }) {
  const statusClass = percent !== undefined ? getStatusClass(percent) : '';

  return (
    <div className={`${styles.card} ${statusClass}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {percent !== undefined && (
        <div className={styles.barWrap}>
          <div className={styles.bar} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      )}
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
