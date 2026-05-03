import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LocalForm from '../components/forms/LocalForm';
import Spinner from '../components/ui/Spinner';
import styles from './TablePage.module.css';

export default function Locals() {
  const [locals, setLocals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', data? }
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const { data } = await api.get('/locals');
    setLocals(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (form) => {
    if (modal?.data?.id) {
      await api.put(`/locals/${modal.data.id}`, form);
    } else {
      await api.post('/locals', form);
    }
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/locals/${confirm.id}`);
    setDeleting(false);
    setConfirm(null);
    load();
  };

  if (loading) return <Spinner center size="lg" />;

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Locales registrados</h2>
        <Button onClick={() => setModal({ mode: 'create' })}><i className="fa-solid fa-plus" /> Nuevo local</Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locals.map((l) => (
              <tr key={l.id}>
                <td className={styles.bold}>{l.name}</td>
                <td>{l.address || '—'}</td>
                <td>{l.phone || '—'}</td>
                <td>
                  <Badge variant={l.active ? 'success' : 'danger'}>
                    {l.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', data: l })}>
                      Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirm(l)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!locals.length && (
              <tr><td colSpan={5} className={styles.empty}>Sin locales registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Editar local' : 'Nuevo local'}
      >
        <LocalForm
          initial={modal?.data}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar local"
        message={`¿Desactivar el local "${confirm?.name}"? Los datos históricos se conservarán.`}
      />
    </div>
  );
}
