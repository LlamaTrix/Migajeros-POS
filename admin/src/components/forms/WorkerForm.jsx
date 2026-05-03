import { useState } from 'react';
import Button from '../ui/Button';
import styles from './Form.module.css';

export default function WorkerForm({ initial, locals, onSubmit, onClose }) {
  const [form, setForm] = useState({ name: '', local_id: '', ...initial });
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
        <label>Nombre completo *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className={styles.field}>
        <label>Local asignado *</label>
        <select value={form.local_id} onChange={(e) => setForm({ ...form, local_id: e.target.value })} required>
          <option value="">Seleccionar local...</option>
          {locals.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      {initial?.code && (
        <div className={styles.field}>
          <label>Código del trabajador</label>
          <div className={styles.codeDisplay}>{initial.code}</div>
        </div>
      )}
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial?.id ? 'Guardar cambios' : 'Crear trabajador'}</Button>
      </div>
    </form>
  );
}
