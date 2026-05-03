import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import styles from './Sidebar.module.css';

export default function Sidebar({ open, onClose }) {
  const { worker, logout } = useAuth();

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>
          <img src={logo} alt="Migajeros" className={styles.logo} />
          <div>
            <div className={styles.brandName}>MIGAJEROS</div>
            <div className={styles.posTag}>Punto de Venta</div>
          </div>
        </div>

        <div className={styles.workerCard}>
          <div className={styles.workerAvatar}>
            <i className="fa-solid fa-user" />
          </div>
          <div className={styles.workerInfo}>
            <div className={styles.workerName}>{worker?.name}</div>
            <div className={styles.workerLocal}>{worker?.local_name}</div>
            <div className={styles.workerAddress}>{worker?.local_address}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/pos"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={onClose}
          >
            <i className="fa-solid fa-cash-register" /> Tomar orden
          </NavLink>
          <NavLink
            to="/ventas"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={onClose}
          >
            <i className="fa-solid fa-chart-bar" /> Ventas del día
          </NavLink>
        </nav>

        <button className={styles.logoutBtn} onClick={logout}>
          <i className="fa-solid fa-right-from-bracket" /> Cerrar jornada
        </button>
      </aside>
    </>
  );
}
