import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import styles from './DailySales.module.css';

export default function DailySales() {
  const { worker } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!worker) return;
    api.get(`/orders/local/${worker.local_id}/today`).then(({ data }) => {
      setOrders(data);
      setLoading(false);
    });
  }, [worker]);

  const paid = orders.filter((o) => o.status === 'paid');
  const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);
  const statusColor = { paid: 'success', pending: 'warning', cancelled: 'danger' };
  const statusLabel = { paid: 'Pagado', pending: 'Pendiente', cancelled: 'Cancelado' };

  if (loading) return <div className={styles.loading}>Cargando ventas...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><i className="fa-solid fa-receipt" /></div>
          <div>
            <div className={styles.summaryValue}>{orders.length}</div>
            <div className={styles.summaryLabel}>Órdenes hoy</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><i className="fa-solid fa-circle-check" /></div>
          <div>
            <div className={styles.summaryValue}>{paid.length}</div>
            <div className={styles.summaryLabel}>Pagadas</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><i className="fa-solid fa-money-bill-wave" /></div>
          <div>
            <div className={styles.summaryValue}>Bs. {totalRevenue.toFixed(2)}</div>
            <div className={styles.summaryLabel}>Total del día</div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Orden</th>
              <th>Atendió</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <>
                <tr key={order.id} className={styles.orderRow}>
                  <td className={styles.time}>
                    {new Date(order.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={styles.orderNum}>#{String(order.id).padStart(5, '0')}</td>
                  <td>{order.worker_name}</td>
                  <td>{order.items?.length || 0}</td>
                  <td className={styles.totalCell}>Bs. {Number(order.total).toFixed(2)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[statusColor[order.status]]}`}>
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.expandBtn}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <i className={`fa-solid fa-chevron-${expanded === order.id ? 'up' : 'down'}`} />
                    </button>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr key={`${order.id}-detail`} className={styles.detailRow}>
                    <td colSpan={7}>
                      <div className={styles.detail}>
                        {order.items?.map((item) => (
                          <div key={item.id} className={styles.detailItem}>
                            <span>{item.quantity}× {item.product_name}</span>
                            <span>Bs. {(item.quantity * item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.notes && (
                          <div className={styles.notes}><i className="fa-solid fa-note-sticky" /> {order.notes}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!orders.length && (
              <tr><td colSpan={7} className={styles.empty}>Sin órdenes hoy</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
