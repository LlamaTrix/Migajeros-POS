import { useState } from 'react';
import Button from '../ui/Button';
import styles from './Form.module.css';

export default function LocalForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label>Nombre del local *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className={styles.field}>
        <label>Dirección</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className={styles.field}>
        <label>Teléfono</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial?.id ? 'Guardar cambios' : 'Crear local'}</Button>
      </div>
    </form>
  );
}
