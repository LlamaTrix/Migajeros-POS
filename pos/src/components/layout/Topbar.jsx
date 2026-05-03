import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from 'react-router-dom';
import Clock from '../ui/Clock';
import styles from './Topbar.module.css';

const titles = {
  '/pos':    { icon: 'fa-solid fa-cash-register', label: 'Nueva Orden' },
  '/ventas': { icon: 'fa-solid fa-chart-bar',     label: 'Ventas del Día' },
};

export default function Topbar({ onMenuClick }) {
  const { worker } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const page = titles[location.pathname] || { icon: 'fa-solid fa-store', label: 'POS' };
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className={styles.topbar}>
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menú">
        <span /><span /><span />
      </button>
      <div className={styles.titleArea}>
        <i className={page.icon} style={{ color: 'var(--red)', marginRight: 8 }} />
        <span className={styles.title}>{page.label}</span>
      </div>
      <div className={styles.right}>
        <div className={styles.timeBlock}>
          <Clock timeClass={styles.time} dateClass={styles.date} />
        </div>
        {itemCount > 0 && (
          <div className={styles.cartBubble}>
            <i className="fa-solid fa-cart-shopping" /> {itemCount}
          </div>
        )}
        <div className={styles.workerTag}>{worker?.name?.split(' ')[0]}</div>
      </div>
    </header>
  );
}
