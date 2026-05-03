const pool = require('../config/db');

const getByOrder = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM invoices WHERE order_id = ?',
    [req.params.orderId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json(rows[0]);
};

module.exports = { getByOrder };
