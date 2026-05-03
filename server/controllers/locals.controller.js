const pool = require('../config/db');

const getAll = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM locals WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(rows);
};

const getOne = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM locals WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Local no encontrado' });
  res.json(rows[0]);
};

const create = async (req, res) => {
  const { name, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const [result] = await pool.query(
    'INSERT INTO locals (name, address, phone) VALUES (?, ?, ?)',
    [name, address || null, phone || null]
  );
  const [rows] = await pool.query('SELECT * FROM locals WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
};

const update = async (req, res) => {
  const { name, address, phone, active } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined)   { fields.push('name = ?');    values.push(name); }
  if (address !== undefined){ fields.push('address = ?'); values.push(address); }
  if (phone !== undefined)  { fields.push('phone = ?');   values.push(phone); }
  if (active !== undefined) { fields.push('active = ?');  values.push(active); }

  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  values.push(req.params.id);
  await pool.query(
    `UPDATE locals SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  const [rows] = await pool.query('SELECT * FROM locals WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Local no encontrado' });
  res.json(rows[0]);
};

const remove = async (req, res) => {
  const [result] = await pool.query(
    'UPDATE locals SET deleted_at = NOW(), active = 0 WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Local no encontrado' });
  res.json({ message: 'Local eliminado' });
};

module.exports = { getAll, getOne, create, update, remove };
