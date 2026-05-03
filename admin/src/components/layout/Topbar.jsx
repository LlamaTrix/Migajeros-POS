import { useLocation } from 'react-router-dom';
import styles from './Topbar.module.css';

const titles = {
  '/':         { icon: 'fa-solid fa-chart-pie',  label: 'Dashboard' },
  '/locals':   { icon: 'fa-solid fa-store',       label: 'Locales' },
  '/workers':  { icon: 'fa-solid fa-users',       label: 'Trabajadores' },
  '/products': { icon: 'fa-solid fa-burger',      label: 'Productos' },
  '/reports':  { icon: 'fa-solid fa-chart-bar',   label: 'Reportes' },
};

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const page = titles[location.pathname] || { icon: 'fa-solid fa-gear', label: 'Admin' };
  const today = new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className={styles.topbar}>
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menú">
        <span /><span /><span />
      </button>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          <i className={page.icon} style={{ fontSize: 20, marginRight: 8 }} />
          {page.label}
        </h1>
        <span className={styles.date}>{today}</span>
      </div>
      <div className={styles.right}>
        <div className={styles.brandTag}>MIGAJEROS</div>
      </div>
    </header>
  );
}
