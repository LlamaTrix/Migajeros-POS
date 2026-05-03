import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import styles from './Reports.module.css';

const TABS = ['Diario', 'Por Local', 'Por Trabajador', 'Por Producto', 'Por Hora', 'Finanzas'];
const FINANCE_TAB = 5;

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locals, setLocals] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', localId: '', workerId: '' });

  useEffect(() => {
    Promise.all([api.get('/locals'), api.get('/workers')]).then(([l, w]) => {
      setLocals(l.data);
      setWorkers(w.data);
    });
  }, []);

  useEffect(() => { load(); }, [tab, filters]);

  const endpoints = ['/reports/daily', '/reports/by-local', '/reports/by-worker', '/reports/by-product', '/reports/by-hour'];

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      if (tab === FINANCE_TAB) {
        const { data: f } = await api.get('/expenses/summary', { params });
        setFinancial(f);
      } else {
        const { data: d } = await api.get(endpoints[tab], { params });
        setData(d);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `reporte-${TABS[tab]}.csv`; a.click();
  };

  const renderChart = () => {
    if (!data.length) return <div className={styles.empty}>Sin datos para el período seleccionado</div>;
    if (tab === 0) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.map((r) => ({ fecha: r.date, ingresos: Number(r.total_revenue) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`Bs. ${v.toFixed(2)}`]} />
            <Line type="monotone" dataKey="ingresos" stroke="#d21f17" strokeWidth={2} dot={{ fill: '#FFB703' }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (tab === 4) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.map((r) => ({ hora: `${r.hour}:00`, ingresos: Number(r.total_revenue) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`Bs. ${v.toFixed(2)}`, 'Ingresos']} />
            <Bar dataKey="ingresos" fill="#FFB703" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    const nameKey = tab === 1 ? 'local_name' : tab === 2 ? 'worker_name' : 'product_name';
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.map((r) => ({ nombre: r[nameKey], ingresos: Number(r.total_revenue) }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`Bs. ${v.toFixed(2)}`, 'Ingresos']} />
          <Bar dataKey="ingresos" fill="#d21f17" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Reportes de ventas</h2>
        <button className={styles.exportBtn} onClick={exportCSV}>⬇ Exportar CSV</button>
      </div>

      <div className={styles.filtersRow}>
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <select value={filters.localId} onChange={(e) => setFilters({ ...filters, localId: e.target.value })}>
          <option value="">Todos los locales</option>
          {locals.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filters.workerId} onChange={(e) => setFilters({ ...filters, workerId: e.target.value })}>
          <option value="">Todos los trabajadores</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} className={`${styles.tab} ${tab === i ? styles.activeTab : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {loading ? <Spinner center /> : tab === FINANCE_TAB ? (
          financial && (
            <div className={styles.financePanel}>
              <div className={styles.finGrid}>
                {[
                  { label: 'Órdenes', value: financial.orders, isMoney: false, color: '#1565c0' },
                  { label: 'Ingresos brutos', value: financial.revenue, isMoney: true, color: '#2e7d32' },
                  { label: 'Costo de productos', value: financial.costOfGoods, isMoney: true, color: '#e65100' },
                  { label: 'Ganancia bruta', value: financial.grossProfit, isMoney: true, color: '#6a1b9a' },
                  { label: 'Gastos totales', value: financial.expenses, isMoney: true, color: '#c62828' },
                  { label: 'Ganancia neta', value: financial.netProfit, isMoney: true, color: financial.netProfit >= 0 ? '#1b5e20' : '#b71c1c', highlight: true },
                ].map((item) => (
                  <div key={item.label} className={`${styles.finStat} ${item.highlight ? styles.finHighlight : ''}`}
                    style={item.highlight ? { borderColor: item.color } : {}}>
                    <div className={styles.finStatLabel}>{item.label}</div>
                    <div className={styles.finStatValue} style={{ color: item.color }}>
                      {item.isMoney ? `Bs. ${Number(item.value).toFixed(2)}` : item.value}
                    </div>
                  </div>
                ))}
              </div>
              {financial.expensesByType?.length > 0 && (
                <div className={styles.expTypeBreak}>
                  <h3 className={styles.breakTitle}>Desglose de gastos por tipo</h3>
                  <div className={styles.expTypeGrid}>
                    {financial.expensesByType.map((t) => (
                      <div key={t.type} className={styles.expTypeCard}>
                        <div className={styles.expTypeLabel}>{t.type === 'fixed' ? 'Fijos' : t.type === 'ingredient' ? 'Ingredientes' : 'Otros'}</div>
                        <div className={styles.expTypeValue}>Bs. {Number(t.total).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <>
            <div className={styles.chartWrap}>{renderChart()}</div>
            {data.length > 0 && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{Object.keys(data[0]).map((k) => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j}>{typeof v === 'number' && String(v).includes('.') ? `Bs. ${Number(v).toFixed(2)}` : v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
