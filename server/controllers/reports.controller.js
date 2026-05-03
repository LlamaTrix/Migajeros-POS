const pool = require('../config/db');

const buildFilters = (query) => {
  const { startDate, endDate, localId, workerId } = query;
  const conditions = ['o.status = "paid"'];
  const params = [];
  if (startDate) { conditions.push('DATE(o.created_at) >= ?'); params.push(startDate); }
  if (endDate)   { conditions.push('DATE(o.created_at) <= ?'); params.push(endDate); }
  if (localId)   { conditions.push('o.local_id = ?'); params.push(localId); }
  if (workerId)  { conditions.push('o.worker_id = ?'); params.push(workerId); }
  return { where: conditions.join(' AND '), params };
};

const daily = async (req, res) => {
  const { where, params } = buildFilters(req.query);
  const [rows] = await pool.query(
    `SELECT DATE(o.created_at) as date,
            COUNT(*) as total_orders,
            SUM(o.total) as total_revenue,
            AVG(o.total) as avg_order
     FROM orders o WHERE ${where}
     GROUP BY DATE(o.created_at) ORDER BY date DESC`,
    params
  );
  res.json(rows);
};

const byLocal = async (req, res) => {
  const { where, params } = buildFilters(req.query);
  const [rows] = await pool.query(
    `SELECT l.id, l.name as local_name,
            COUNT(*) as total_orders,
            SUM(o.total) as total_revenue
     FROM orders o JOIN locals l ON o.local_id = l.id
     WHERE ${where}
     GROUP BY l.id ORDER BY total_revenue DESC`,
    params
  );
  res.json(rows);
};

const byWorker = async (req, res) => {
  const { where, params } = buildFilters(req.query);
  const [rows] = await pool.query(
    `SELECT w.id, w.name as worker_name, l.name as local_name,
            COUNT(*) as total_orders,
            SUM(o.total) as total_revenue
     FROM orders o JOIN workers w ON o.worker_id = w.id JOIN locals l ON o.local_id = l.id
     WHERE ${where}
     GROUP BY w.id ORDER BY total_revenue DESC`,
    params
  );
  res.json(rows);
};

const byProduct = async (req, res) => {
  const { where, params } = buildFilters(req.query);
  const [rows] = await pool.query(
    `SELECT p.id, p.name as product_name, c.name as category,
            SUM(oi.quantity) as total_sold,
            SUM(oi.quantity * oi.unit_price) as total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE ${where}
     GROUP BY p.id ORDER BY total_sold DESC`,
    params
  );
  res.json(rows);
};

const byHour = async (req, res) => {
  const { where, params } = buildFilters(req.query);
  const [rows] = await pool.query(
    `SELECT HOUR(o.created_at) as hour,
            COUNT(*) as total_orders,
            SUM(o.total) as total_revenue
     FROM orders o WHERE ${where}
     GROUP BY HOUR(o.created_at) ORDER BY hour`,
    params
  );
  res.json(rows);
};

const summary = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [[todaySales]] = await pool.query(
    'SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders WHERE status="paid" AND DATE(created_at) = ?',
    [today]
  );
  const [[activeWorkers]] = await pool.query(
    'SELECT COUNT(*) as cnt FROM work_sessions WHERE clock_out IS NULL AND DATE(clock_in) = ?',
    [today]
  );
  const [topProducts] = await pool.query(
    `SELECT p.name, SUM(oi.quantity) as sold FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status = "paid" AND DATE(o.created_at) = ?
     GROUP BY p.id ORDER BY sold DESC LIMIT 5`,
    [today]
  );
  res.json({ today: todaySales, activeWorkers: activeWorkers.cnt, topProducts });
};

module.exports = { daily, byLocal, byWorker, byProduct, byHour, summary };
