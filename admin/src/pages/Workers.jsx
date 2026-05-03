import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import WorkerForm from '../components/forms/WorkerForm';
import Spinner from '../components/ui/Spinner';
import styles from './TablePage.module.css';
import wStyles from './Workers.module.css';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [locals, setLocals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [sessionModal, setSessionModal] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterLocal, setFilterLocal] = useState('');
  const [newWorker, setNewWorker] = useState(null);

  const load = async () => {
    const [w, l] = await Promise.all([api.get('/workers'), api.get('/locals')]);
    setWorkers(w.data);
    setLocals(l.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (form) => {
    if (modal?.data?.id) {
      await api.put(`/workers/${modal.data.id}`, form);
    } else {
      const { data } = await api.post('/workers', form);
      setNewWorker(data);
    }
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/workers/${confirm.id}`);
    setDeleting(false);
    setConfirm(null);
    load();
  };

  const openSessions = async (worker) => {
    setSessionModal(worker);
    const { data } = await api.get(`/workers/${worker.id}/sessions`);
    setSessions(data);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const filtered = filterLocal ? workers.filter((w) => String(w.local_id) === filterLocal) : workers;

  if (loading) return <Spinner center size="lg" />;

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Trabajadores</h2>
        <Button onClick={() => setModal({ mode: 'create' })}><i className="fa-solid fa-plus" /> Nuevo trabajador</Button>
      </div>

      <div className={styles.filters}>
        <select value={filterLocal} onChange={(e) => setFilterLocal(e.target.value)}>
          <option value="">Todos los locales</option>
          {locals.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Local</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id}>
                <td className={styles.bold}>{w.name}</td>
                <td>
                  <span className={styles.code} onClick={() => copyCode(w.code)} title="Copiar código">
                    {w.code}
                  </span>
                </td>
                <td>{w.local_name}</td>
                <td>
                  <Badge variant={w.active ? 'success' : 'danger'}>
                    {w.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', data: w })}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => openSessions(w)}>Historial</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirm(w)}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={5} className={styles.empty}>Sin trabajadores</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New worker code reveal */}
      <Modal open={!!newWorker} onClose={() => setNewWorker(null)} title="¡Trabajador creado!" size="sm">
        <div className={wStyles.codeReveal}>
          <p>Trabajador <strong>{newWorker?.name}</strong> registrado exitosamente.</p>
          <p>Código de acceso al POS:</p>
          <div className={wStyles.bigCode}>{newWorker?.code}</div>
          <p className={wStyles.hint}>Guarda este código — el trabajador lo necesita para ingresar.</p>
        </div>
        <Button onClick={() => setNewWorker(null)} style={{ width: '100%', marginTop: 8 }}>Entendido</Button>
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Editar trabajador' : 'Nuevo trabajador'}
      >
        <WorkerForm
          initial={modal?.data}
          locals={locals.filter((l) => l.active)}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={!!sessionModal} onClose={() => setSessionModal(null)} title={`Historial: ${sessionModal?.name}`} size="lg">
        <div className={wStyles.sessionsTable}>
          <table>
            <thead><tr><th>Entrada</th><th>Salida</th><th>Duración</th></tr></thead>
            <tbody>
              {sessions.map((s) => {
                const dur = s.clock_out
                  ? Math.round((new Date(s.clock_out) - new Date(s.clock_in)) / 60000)
                  : null;
                return (
                  <tr key={s.id}>
                    <td>{new Date(s.clock_in).toLocaleString('es-BO')}</td>
                    <td>{s.clock_out ? new Date(s.clock_out).toLocaleString('es-BO') : <Badge variant="success">En curso</Badge>}</td>
                    <td>{dur != null ? `${Math.floor(dur / 60)}h ${dur % 60}m` : '—'}</td>
                  </tr>
                );
              })}
              {!sessions.length && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-500)' }}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar trabajador"
        message={`¿Desactivar a "${confirm?.name}"?`}
      />
    </div>
  );
}
