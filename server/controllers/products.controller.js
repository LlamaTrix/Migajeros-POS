const pool = require('../config/db');

// Campos que devuelve el POS — sin cost_price
const POS_FIELDS = 'p.id, p.name, p.description, p.price, p.category_id, p.image_url, p.available, c.name as category_name';
// Campos completos para admin — incluye cost_price
const ADMIN_FIELDS = `p.*, c.name as category_name`;

const getAll = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const fields  = isAdmin ? ADMIN_FIELDS : POS_FIELDS;
  const [rows] = await pool.query(
    `SELECT ${fields} FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.deleted_at IS NULL
     ORDER BY c.name, p.name`
  );
  res.json(rows);
};

const getCategories = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(rows);
};

const getOne = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const fields  = isAdmin ? ADMIN_FIELDS : POS_FIELDS;
  const [rows] = await pool.query(
    `SELECT ${fields} FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(rows[0]);
};

const create = async (req, res) => {
  const { name, description, price, cost_price, category_id } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Nombre y precio requeridos' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await pool.query(
    'INSERT INTO products (name, description, price, cost_price, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description || null, price, cost_price || 0, category_id || null, image_url]
  );
  const [rows] = await pool.query(
    `SELECT ${ADMIN_FIELDS} FROM products p
     LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
};

const update = async (req, res) => {
  const { name, description, price, cost_price, category_id, available } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined)        { fields.push('name = ?');        values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (price !== undefined)       { fields.push('price = ?');       values.push(price); }
  if (cost_price !== undefined)  { fields.push('cost_price = ?');  values.push(cost_price); }
  if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id || null); }
  if (available !== undefined)   { fields.push('available = ?');   values.push(available); }
  if (req.file)                  { fields.push('image_url = ?');   values.push(`/uploads/${req.file.filename}`); }

  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  values.push(req.params.id);
  await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  const [rows] = await pool.query(
    `SELECT ${ADMIN_FIELDS} FROM products p
     LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(rows[0]);
};

const toggleAvailability = async (req, res) => {
  await pool.query(
    'UPDATE products SET available = NOT available WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
};

const remove = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
  await pool.query(
    'UPDATE products SET deleted_at = NOW(), available = 0 WHERE id = ?',
    [req.params.id]
  );
  res.json({ message: 'Producto eliminado' });
};

module.exports = { getAll, getCategories, getOne, create, update, toggleAvailability, remove };
