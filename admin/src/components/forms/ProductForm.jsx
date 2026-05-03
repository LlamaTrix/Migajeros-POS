import { useState, useRef } from 'react';
import Button from '../ui/Button';
import styles from './Form.module.css';

export default function ProductForm({ initial, categories, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', price: '', cost_price: '', category_id: '', ...initial,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);
      await onSubmit(fd);
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

      <div className={styles.imageUpload} onClick={() => fileRef.current.click()}>
        {preview
          ? <img src={preview} alt="preview" className={styles.imgPreview} />
          : <div className={styles.imgPlaceholder}><i className="fa-solid fa-camera" /> Subir imagen</div>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
      </div>

      <div className={styles.field}>
        <label>Nombre del producto *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Precio de venta (Bs.) *</label>
          <input type="number" min="0" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div className={styles.field}>
          <label>Costo de preparación (Bs.)</label>
          <input type="number" min="0" step="0.01" value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            placeholder="0.00" />
        </div>
      </div>

      <div className={styles.field}>
        <label>Categoría</label>
        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Descripción</label>
        <textarea rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className={styles.hint}>
        <i className="fa-solid fa-circle-info" /> El costo de preparación solo es visible en administración.
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial?.id ? 'Guardar cambios' : 'Crear producto'}</Button>
      </div>
    </form>
  );
}
