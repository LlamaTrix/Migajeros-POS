import styles from './Badge.module.css';

export default function Badge({ children, variant = 'default', onClick }) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      title={onClick ? 'Copiar' : undefined}
    >
      {children}
    </span>
  );
}
