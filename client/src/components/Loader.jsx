import styles from './Loader.module.css'

export default function Loader({ fullscreen }) {
  if (fullscreen) return (
    <div className={styles.fullscreen}>
      <div className={styles.logo}>TF</div>
      <div className={styles.spinner} />
    </div>
  )
  return <div className={styles.spinner} />
}