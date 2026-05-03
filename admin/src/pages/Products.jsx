import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProductForm from '../components/forms/ProductForm';
import Spinner from '../components/ui/Spinner';
import styles from './Products.module.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [p, c] = await Promise.all([api.get('/products'), api.get('/products/categories')]);
    setProducts(p.data);
    setCategories(c.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (fd) => {
    if (modal?.data?.id) {
      await api.put(`/products/${modal.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    load();
  };

  const handleToggle = async (product) => {
    await api.patch(`/products/${product.id}/availability`);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/products/${confirm.id}`);
    setDeleting(false);
    setConfirm(null);
    load();
  };

  const filtered = products.filter((p) => {
    const matchCat = !filterCat || String(p.category_id) === filterCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <Spinner center size="lg" />;

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Productos</h2>
        <Button onClick={() => setModal({ mode: 'create' })}><i className="fa-solid fa-plus" /> Nuevo producto</Button>
      </div>

      <div className={styles.filters}>
        <input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} className={`${styles.card} ${!p.available ? styles.unavailable : ''}`}>
            <div className={styles.imgWrap}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name} />
                : <div className={styles.imgPlaceholder}><i className="fa-solid fa-utensils" /></div>}
              <Badge variant={p.available ? 'success' : 'danger'} onClick={() => handleToggle(p)}>
                {p.available ? 'Disponible' : 'No disponible'}
              </Badge>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.catTag}>{p.category_name || 'Sin categoría'}</div>
              <h3 className={styles.productName}>{p.name}</h3>
              <p className={styles.description}>{p.description || ''}</p>
              <div className={styles.costRow}>
                <span className={styles.costLabel}><i className="fa-solid fa-coins" /> Costo</span>
                <span className={styles.costValue}>Bs. {Number(p.cost_price || 0).toFixed(2)}</span>
                <span className={styles.marginBadge}>
                  <i className="fa-solid fa-arrow-trend-up" /> {p.cost_price > 0 ? ((p.price - p.cost_price) / p.price * 100).toFixed(0) : '—'}%
                </span>
              </div>
              <div className={styles.footer}>
                <span className={styles.price}>Bs. {Number(p.price).toFixed(2)}</span>
                <div className={styles.cardActions}>
                  <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', data: p })}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirm(p)}>Eliminar</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className={styles.empty}>Sin productos encontrados</div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
      >
        <ProductForm
          initial={modal?.data}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar producto"
        message={`¿Eliminar "${confirm?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
