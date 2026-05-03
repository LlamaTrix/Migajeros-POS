import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import styles from './Expenses.module.css';

const TYPE_LABEL = { fixed: 'Fijo', ingredient: 'Ingrediente', other: 'Otro' };
const TYPE_VARIANT = { fixed: 'info', ingredient: 'warning', other: 'default' };

function ExpenseForm({ initial, categories, locals, onSubmit, onClose }) {
  const [form, setForm] = useState({
    description: '', amount: '', category_id: '', local_id: '',
    expense_date: new Date().toISOString().split('T')[0], notes: '',
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onSubmit(form); onClose(); }
    catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Categoría</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({TYPE_LABEL[c.type]})</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>Local</label>
          <select value={form.local_id} onChange={(e) => setForm({ ...form, local_id: e.target.value })}>
            <option value="">General (todos)</option>
            {locals.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label>Descripción *</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Monto (Bs.) *</label>
          <input type="number" min="0" step="0.01" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div className={styles.field}>
          <label>Fecha *</label>
          <input type="date" value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
        </div>
      </div>
      <div className={styles.field}>
        <label>Notas</label>
        <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial?.id ? 'Guardar cambios' : 'Registrar gasto'}</Button>
      </div>
    </form>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locals, setLocals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
    endDate: new Date().toISOString().split('T')[0],
    localId: '', categoryId: '',
  });

  const load = async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const [e, c, l] = await Promise.all([
      api.get('/expenses', { params }),
      api.get('/expenses/categories'),
      api.get('/locals'),
    ]);
    setExpenses(e.data);
    setCategories(c.data);
    setLocals(l.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const handleSubmit = async (form) => {
    if (modal?.data?.id) await api.put(`/expenses/${modal.data.id}`, form);
    else await api.post('/expenses', form);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/expenses/${confirm.id}`);
    setDeleting(false); setConfirm(null); load();
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Agrupar por tipo para el resumen
  const byType = expenses.reduce((acc, e) => {
    const t = e.category_type || 'other';
    acc[t] = (acc[t] || 0) + Number(e.amount);
    return acc;
  }, {});

  if (loading) return <Spinner center size="lg" />;

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Gastos</h2>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <i className="fa-solid fa-plus" /> Registrar gasto
        </Button>
      </div>

      {/* Filtros */}
      <div className={styles.filtersRow}>
        <input type="date" value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <select value={filters.localId} onChange={(e) => setFilters({ ...filters, localId: e.target.value })}>
          <option value="">Todos los locales</option>
          {locals.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Resumen por tipo */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total gastos</div>
          <div className={styles.summaryValue}>Bs. {total.toFixed(2)}</div>
        </div>
        {Object.entries(byType).map(([type, amount]) => (
          <div key={type} className={`${styles.summaryCard} ${styles[type]}`}>
            <div className={styles.summaryLabel}>{TYPE_LABEL[type] || type}</div>
            <div className={styles.summaryValue}>Bs. {Number(amount).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Local</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className={styles.date}>{new Date(e.expense_date + 'T12:00:00').toLocaleDateString('es-BO')}</td>
                <td>
                  <div className={styles.desc}>{e.description}</div>
                  {e.notes && <div className={styles.notes}>{e.notes}</div>}
                </td>
                <td>
                  {e.category_name
                    ? <Badge variant={TYPE_VARIANT[e.category_type]}>{e.category_name}</Badge>
                    : <span className={styles.none}>—</span>}
                </td>
                <td>{e.local_name || <span className={styles.none}>General</span>}</td>
                <td className={styles.amount}>Bs. {Number(e.amount).toFixed(2)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', data: e })}>
                      <i className="fa-solid fa-pen" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirm(e)}>
                      <i className="fa-solid fa-trash" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr><td colSpan={6} className={styles.empty}>Sin gastos en el período seleccionado</td></tr>
            )}
            {expenses.length > 0 && (
              <tr className={styles.totalRow}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                <td className={styles.amount} style={{ fontWeight: 700 }}>Bs. {total.toFixed(2)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Editar gasto' : 'Registrar gasto'}>
        <ExpenseForm
          initial={modal?.data}
          categories={categories}
          locals={locals}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Eliminar gasto"
        message={`¿Eliminar el gasto "${confirm?.description}" de Bs. ${Number(confirm?.amount || 0).toFixed(2)}?`}
      />
    </div>
  );
}
