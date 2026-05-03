import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import styles from './Login.module.css';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function Login() {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleKey = useCallback((k) => {
    if (k === '⌫') { setCode((c) => c.slice(0, -1)); return; }
    if (!k) return;
    setCode((c) => c.length >= 6 ? c : c + k);
  }, []);

  // Soporte teclado físico
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') { handleKey(e.key); return; }
      if (e.key === 'Backspace') { handleKey('⌫'); return; }
      if (e.key === 'Enter') { handleLogin(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey, code]);

  const handleLogin = async () => {
    if (!code || code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await login(code);
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); handleLogin(); };

  // Mostrar dígitos con guiones de placeholder
  const displaySlots = Array.from({ length: 6 }, (_, i) => code[i] ?? null);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={logo} alt="Migajeros" className={styles.logo} />
        <h1 className={styles.title}>MIGAJEROS</h1>
        <p className={styles.sub}>Punto de Venta</p>
        <p className={styles.instructions}>Ingresa tu código de acceso</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.codeDisplay}>
            {displaySlots.map((digit, i) => (
              <span
                key={i}
                className={`${styles.slot} ${digit !== null ? styles.slotFilled : ''} ${i === code.length ? styles.slotCursor : ''}`}
              >
                {digit !== null ? '●' : ''}
              </span>
            ))}
          </div>

          <div className={styles.keypad}>
            {KEYS.map((k, i) => (
              k === '' ? (
                <span key={i} />
              ) : (
                <button
                  type="button"
                  key={k}
                  className={`${styles.key} ${k === '⌫' ? styles.backspace : ''}`}
                  onClick={() => handleKey(k)}
                >
                  {k === '⌫' ? <i className="fa-solid fa-delete-left" /> : k}
                </button>
              )
            ))}
          </div>

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading || code.length < 6}
          >
            {loading ? 'Verificando...' : <><i className="fa-solid fa-right-to-bracket" /> Ingresar</>}
          </button>
        </form>
      </div>
    </div>
  );
}
