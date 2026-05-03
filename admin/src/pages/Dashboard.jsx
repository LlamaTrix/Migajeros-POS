import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [hourData, setHourData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = today.slice(0, 7) + '-01';

    const load = async () => {
      try {
        const [s, h, f] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/by-hour'),
          api.get('/expenses/summary', { params: { startDate: firstOfMonth, endDate: today } }),
        ]);
        setSummary(s.data);
        setHourData(h.data.map((r) => ({ hour: `${r.hour}:00`, ventas: Number(r.total_revenue) })));
        setFinancial(f.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner center size="lg" />;

  const fmt = (n) => `Bs. ${Number(n || 0).toFixed(2)}`;

  return (
    <div className="page-container">
      <div className={styles.statsGrid}>
        <StatCard
          icon={<i className="fa-solid fa-money-bill-wave" />}
          label="Ingresos hoy"
          value={`Bs. ${Number(summary?.today?.revenue || 0).toFixed(2)}`}
          color="red"
        />
        <StatCard
          icon={<i className="fa-solid fa-receipt" />}
          label="Órdenes hoy"
          value={summary?.today?.orders || 0}
          color="yellow"
        />
        <StatCard
          icon={<i className="fa-solid fa-users" />}
          label="Trabajadores activos"
          value={summary?.activeWorkers || 0}
          color="green"
        />
        <StatCard
          icon={<i className="fa-solid fa-star" />}
          label="Producto más vendido"
          value={summary?.topProducts?.[0]?.name || '—'}
          sub={summary?.topProducts?.[0] ? `${summary.topProducts[0].sold} uds.` : ''}
          color="blue"
        />
      </div>

      {/* Financial summary (current month) */}
      <div className={styles.financialRow}>
        <div className={styles.finCard}>
          <div className={styles.finIcon} style={{ background: '#e8f5e9' }}>
            <i className="fa-solid fa-arrow-up-right-dots" style={{ color: '#2e7d32' }} />
          </div>
          <div>
            <div className={styles.finLabel}>Ventas del mes</div>
            <div className={styles.finValue}>{fmt(financial?.revenue)}</div>
          </div>
        </div>
        <div className={styles.finCard}>
          <div className={styles.finIcon} style={{ background: '#fff3e0' }}>
            <i className="fa-solid fa-coins" style={{ color: '#e65100' }} />
          </div>
          <div>
            <div className={styles.finLabel}>Costo de productos</div>
            <div className={styles.finValue}>{fmt(financial?.costOfGoods)}</div>
          </div>
        </div>
        <div className={styles.finCard}>
          <div className={styles.finIcon} style={{ background: '#fce4ec' }}>
            <i className="fa-solid fa-wallet" style={{ color: '#c62828' }} />
          </div>
          <div>
            <div className={styles.finLabel}>Gastos del mes</div>
            <div className={styles.finValue}>{fmt(financial?.expenses)}</div>
          </div>
        </div>
        <div className={`${styles.finCard} ${styles.netCard}`}>
          <div className={styles.finIcon} style={{ background: '#e3f2fd' }}>
            <i className="fa-solid fa-chart-line" style={{ color: '#1565c0' }} />
          </div>
          <div>
            <div className={styles.finLabel}>Ganancia neta</div>
            <div className={`${styles.finValue} ${Number(financial?.netProfit || 0) >= 0 ? styles.positive : styles.negative}`}>
              {fmt(financial?.netProfit)}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Ventas por hora (hoy)</h2>
          {hourData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`Bs. ${v.toFixed(2)}`, 'Ventas']} />
                <Bar dataKey="ventas" fill="#d21f17" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>Sin datos de hoy</div>
          )}
        </div>

        <div className={styles.topCard}>
          <h2 className={styles.cardTitle}>Top 5 productos hoy</h2>
          {summary?.topProducts?.length > 0 ? (
            <ul className={styles.topList}>
              {summary.topProducts.map((p, i) => (
                <li key={p.name} className={styles.topItem}>
                  <span className={styles.topRank}>{i + 1}</span>
                  <span className={styles.topName}>{p.name}</span>
                  <span className={styles.topSold}>{p.sold} uds.</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>Sin ventas hoy</div>
          )}
        </div>
      </div>
    </div>
  );
}
