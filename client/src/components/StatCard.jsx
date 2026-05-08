import styles from './StatCard.module.css'

export default function StatCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div className={styles.card} style={{ animationDelay: `${delay}ms`, '--accent-local': accent || 'var(--accent)' }}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      <div className={styles.glow} />
    </div>
  )
}