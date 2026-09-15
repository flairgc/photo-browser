import styles from './Loader.module.css';

export function Loader({ label = 'Загрузка…' }: { label?: string }) {
  return <div className={styles.loader} role="status">
    <span className={styles.spinner} aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
