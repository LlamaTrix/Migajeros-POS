const pool = require('../config/db');

const getCategories = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM expense_categories ORDER BY type, name');
  res.json(rows);
};

const getAll = async (req, res) => {
  const { startDate, endDate, localId, categoryId } = req.query;
  let sql = `
    SELECT e.*, ec.name as category_name, ec.type as category_type, l.name as local_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    LEFT JOIN locals l ON e.local_id = l.id
    WHERE e.deleted_at IS NULL`;
  const params = [];
  if (startDate)  { sql += ' AND e.expense_date >= ?'; params.push(startDate); }
  if (endDate)    { sql += ' AND e.expense_date <= ?'; params.push(endDate); }
  if (localId)    { sql += ' AND e.local_id = ?';      params.push(localId); }
  if (categoryId) { sql += ' AND e.category_id = ?';   params.push(categoryId); }
  sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
};

const create = async (req, res) => {
  const { category_id, local_id, description, amount, expense_date, notes } = req.body;
  if (!description || !amount) return res.status(400).json({ error: 'Descripción y monto requeridos' });
  const [result] = await pool.query(
    'INSERT INTO expenses (category_id, local_id, description, amount, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [category_id || null, local_id || null, description, amount,
     expense_date || new Date().toISOString().split('T')[0], notes || null]
  );
  const [rows] = await pool.query(
    `SELECT e.*, ec.name as category_name, ec.type as category_type, l.name as local_name
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     LEFT JOIN locals l ON e.local_id = l.id
     WHERE e.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
};

const update = async (req, res) => {
  const { category_id, local_id, description, amount, expense_date, notes } = req.body;
  const fields = [];
  const values = [];
  if (category_id !== undefined)  { fields.push('category_id = ?');  values.push(category_id || null); }
  if (local_id !== undefined)     { fields.push('local_id = ?');      values.push(local_id || null); }
  if (description !== undefined)  { fields.push('description = ?');   values.push(description); }
  if (amount !== undefined)       { fields.push('amount = ?');        values.push(amount); }
  if (expense_date !== undefined) { fields.push('expense_date = ?');  values.push(expense_date); }
  if (notes !== undefined)        { fields.push('notes = ?');         values.push(notes); }
  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  values.push(req.params.id);
  await pool.query(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  const [rows] = await pool.query(
    `SELECT e.*, ec.name as category_name, ec.type as category_type, l.name as local_name
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     LEFT JOIN locals l ON e.local_id = l.id WHERE e.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json(rows[0]);
};

const remove = async (req, res) => {
  const [result] = await pool.query(
    'UPDATE expenses SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json({ message: 'Gasto eliminado' });
};

// Resumen financiero: ventas - costo productos - gastos = ganancia
const summary = async (req, res) => {
  const { startDate, endDate, localId } = req.query;
  let orderWhere = 'o.status = "paid"';
  let expWhere   = 'e.deleted_at IS NULL';
  const oParams  = [];
  const eParams  = [];

  if (startDate) { orderWhere += ' AND DATE(o.created_at) >= ?'; oParams.push(startDate);
                   expWhere   += ' AND e.expense_date >= ?';      eParams.push(startDate); }
  if (endDate)   { orderWhere += ' AND DATE(o.created_at) <= ?'; oParams.push(endDate);
                   expWhere   += ' AND e.expense_date <= ?';      eParams.push(endDate); }
  if (localId)   { orderWhere += ' AND o.local_id = ?';          oParams.push(localId);
                   expWhere   += ' AND e.local_id = ?';           eParams.push(localId); }

  // Ventas e ingresos
  const [[sales]] = await pool.query(
    `SELECT COUNT(*) as orders, COALESCE(SUM(o.total),0) as revenue FROM orders o WHERE ${orderWhere}`,
    oParams
  );

  // Costo de ventas (cost_price * cantidad vendida)
  const [[costOfSales]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) as total_cost
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE ${orderWhere}`,
    oParams
  );

  // Gastos registrados, agrupados por tipo
  const [expByType] = await pool.query(
    `SELECT ec.type, COALESCE(SUM(e.amount), 0) as total
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     WHERE ${expWhere}
     GROUP BY ec.type`,
    eParams
  );

  const [[totalExp]] = await pool.query(
    `SELECT COALESCE(SUM(e.amount), 0) as total FROM expenses e WHERE ${expWhere}`,
    eParams
  );

  const revenue     = Number(sales.revenue);
  const costGoods   = Number(costOfSales.total_cost);
  const expenses    = Number(totalExp.total);
  const grossProfit = revenue - costGoods;
  const netProfit   = grossProfit - expenses;

  res.json({
    orders:       sales.orders,
    revenue,
    costOfGoods:  costGoods,
    grossProfit,
    expenses,
    netProfit,
    expensesByType: expByType,
  });
};

module.exports = { getCategories, getAll, create, update, remove, summary };
