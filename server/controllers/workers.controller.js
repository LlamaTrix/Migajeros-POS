const pool = require('../config/db');
const { generateWorkerCode } = require('../utils/codeGenerator');

const getAll = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.*, l.name as local_name
     FROM workers w
     LEFT JOIN locals l ON w.local_id = l.id
     WHERE w.deleted_at IS NULL
     ORDER BY w.name`
  );
  res.json(rows);
};

const getOne = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.*, l.name as local_name
     FROM workers w
     LEFT JOIN locals l ON w.local_id = l.id
     WHERE w.id = ? AND w.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Trabajador no encontrado' });
  res.json(rows[0]);
};

const create = async (req, res) => {
  const { name, local_id } = req.body;
  if (!name || !local_id) return res.status(400).json({ error: 'Nombre y local requeridos' });

  const code = await generateWorkerCode();
  const [result] = await pool.query(
    'INSERT INTO workers (name, code, local_id) VALUES (?, ?, ?)',
    [name, code, local_id]
  );
  const [rows] = await pool.query(
    `SELECT w.*, l.name as local_name FROM workers w
     LEFT JOIN locals l ON w.local_id = l.id WHERE w.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
};

const update = async (req, res) => {
  const { name, local_id, active } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined)     { fields.push('name = ?');     values.push(name); }
  if (local_id !== undefined) { fields.push('local_id = ?'); values.push(local_id); }
  if (active !== undefined)   { fields.push('active = ?');   values.push(active); }

  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  values.push(req.params.id);
  await pool.query(
    `UPDATE workers SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  const [rows] = await pool.query(
    `SELECT w.*, l.name as local_name FROM workers w
     LEFT JOIN locals l ON w.local_id = l.id WHERE w.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Trabajador no encontrado' });
  res.json(rows[0]);
};

const remove = async (req, res) => {
  const [result] = await pool.query(
    'UPDATE workers SET deleted_at = NOW(), active = 0 WHERE id = ? AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Trabajador no encontrado' });
  res.json({ message: 'Trabajador eliminado' });
};

const getSessions = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ws.*, w.name as worker_name
     FROM work_sessions ws
     JOIN workers w ON ws.worker_id = w.id
     WHERE ws.worker_id = ?
     ORDER BY ws.clock_in DESC`,
    [req.params.id]
  );
  res.json(rows);
};

module.exports = { getAll, getOne, create, update, remove, getSessions };
