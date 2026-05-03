const pool = require('../config/db');
const { generateOrderQR } = require('../utils/qrGenerator');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const path = require('path');
const fs = require('fs');

const getAll = async (req, res) => {
  const { startDate, endDate, localId, workerId, status } = req.query;
  let sql = `SELECT o.*, l.name as local_name, w.name as worker_name
             FROM orders o
             JOIN locals l ON o.local_id = l.id
             JOIN workers w ON o.worker_id = w.id
             WHERE 1=1`;
  const params = [];
  if (startDate) { sql += ' AND DATE(o.created_at) >= ?'; params.push(startDate); }
  if (endDate)   { sql += ' AND DATE(o.created_at) <= ?'; params.push(endDate); }
  if (localId)   { sql += ' AND o.local_id = ?'; params.push(localId); }
  if (workerId)  { sql += ' AND o.worker_id = ?'; params.push(workerId); }
  if (status)    { sql += ' AND o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
};

const getOne = async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, l.name as local_name, w.name as worker_name
     FROM orders o JOIN locals l ON o.local_id = l.id JOIN workers w ON o.worker_id = w.id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!orders.length) return res.status(404).json({ error: 'Orden no encontrada' });
  const [items] = await pool.query(
    `SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi
     JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
    [req.params.id]
  );
  res.json({ ...orders[0], items });
};

const create = async (req, res) => {
  const { items, payment_method, notes } = req.body;
  const workerId = req.user.workerId;
  const localId = req.user.localId;

  if (!items || !items.length) return res.status(400).json({ error: 'Items requeridos' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify products and get prices
    let total = 0;
    const enriched = [];
    for (const item of items) {
      const [prod] = await conn.query('SELECT * FROM products WHERE id = ? AND available = 1', [item.product_id]);
      if (!prod.length) throw new Error(`Producto ${item.product_id} no disponible`);
      const subtotal = prod[0].price * item.quantity;
      total += subtotal;
      enriched.push({ product_id: item.product_id, quantity: item.quantity, unit_price: prod[0].price });
    }

    const [orderResult] = await conn.query(
      'INSERT INTO orders (local_id, worker_id, total, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
      [localId, workerId, total, payment_method || 'qr', notes || null]
    );
    const orderId = orderResult.insertId;

    for (const item of enriched) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
    }

    await conn.commit();

    const [orders] = await conn.query(
      `SELECT o.*, l.name as local_name, w.name as worker_name
       FROM orders o JOIN locals l ON o.local_id = l.id JOIN workers w ON o.worker_id = w.id
       WHERE o.id = ?`,
      [orderId]
    );
    const [orderItems] = await conn.query(
      `SELECT oi.*, p.name as product_name FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [orderId]
    );

    const qrDataUrl = await generateOrderQR(orders[0]);
    res.status(201).json({ ...orders[0], items: orderItems, qr: qrDataUrl });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
};

const confirmPayment = async (req, res) => {
  const { payment_method } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      `SELECT o.*, l.name as local_name, l.address as local_address, w.name as worker_name
       FROM orders o JOIN locals l ON o.local_id = l.id JOIN workers w ON o.worker_id = w.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (!orders.length) { await conn.rollback(); return res.status(404).json({ error: 'Orden no encontrada' }); }
    if (orders[0].status === 'paid') { await conn.rollback(); return res.status(400).json({ error: 'Orden ya pagada' }); }

    await conn.query(
      'UPDATE orders SET status = "paid", paid_at = NOW(), payment_method = COALESCE(?, payment_method) WHERE id = ?',
      [payment_method || null, req.params.id]
    );

    // Generate invoice number
    const year = new Date().getFullYear();
    const [countRows] = await conn.query(
      'SELECT COUNT(*) as cnt FROM invoices WHERE YEAR(generated_at) = ?',
      [year]
    );
    const invoiceNumber = `INV-${year}-${String(countRows[0].cnt + 1).padStart(5, '0')}`;

    // Generate PDF
    const pdfDir = path.join(__dirname, '..', 'uploads', 'invoices');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfFilename = `${invoiceNumber}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);

    const [items] = await conn.query(
      `SELECT oi.*, p.name as product_name FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const invoiceData = {
      invoice_number: invoiceNumber,
      generated_at: new Date(),
      pdf_url: `/uploads/invoices/${pdfFilename}`,
    };

    await generateInvoicePDF(invoiceData, { ...orders[0], status: 'paid', payment_method: payment_method || orders[0].payment_method }, items, pdfPath);

    const [invResult] = await conn.query(
      'INSERT INTO invoices (order_id, invoice_number, pdf_url) VALUES (?, ?, ?)',
      [req.params.id, invoiceNumber, invoiceData.pdf_url]
    );

    await conn.commit();
    res.json({ message: 'Pago confirmado', invoice: { id: invResult.insertId, ...invoiceData }, items });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

const getTodayByLocal = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, w.name as worker_name FROM orders o
     JOIN workers w ON o.worker_id = w.id
     WHERE o.local_id = ? AND DATE(o.created_at) = CURDATE()
     ORDER BY o.created_at DESC`,
    [req.params.localId]
  );
  const ordersWithItems = await Promise.all(rows.map(async (order) => {
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [order.id]
    );
    return { ...order, items };
  }));
  res.json(ordersWithItems);
};

const getQR = async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, l.name as local_name FROM orders o
     JOIN locals l ON o.local_id = l.id WHERE o.id = ?`,
    [req.params.id]
  );
  if (!orders.length) return res.status(404).json({ error: 'Orden no encontrada' });
  const qr = await generateOrderQR(orders[0]);
  res.json({ qr });
};

module.exports = { getAll, getOne, create, confirmPayment, getTodayByLocal, getQR };
