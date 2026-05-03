import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/',         label: 'Dashboard',     icon: 'fa-solid fa-chart-pie',    end: true },
  { to: '/locals',   label: 'Locales',       icon: 'fa-solid fa-store' },
  { to: '/workers',  label: 'Trabajadores',  icon: 'fa-solid fa-users' },
  { to: '/products', label: 'Productos',     icon: 'fa-solid fa-burger' },
  { to: '/reports',  label: 'Reportes',      icon: 'fa-solid fa-chart-bar' },
  { to: '/expenses', label: 'Gastos',        icon: 'fa-solid fa-wallet' },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>
          <img src={logo} alt="Migajeros" className={styles.logo} />
          <span className={styles.brandText}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <i className={`${item.icon} ${styles.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}><i className="fa-solid fa-user-shield" /></div>
            <span className={styles.username}>{user?.username}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Cerrar sesión">
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </aside>
    </>
  );
}
