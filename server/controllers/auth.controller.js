const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' });

  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const valid = password === process.env.ADMIN_PASSWORD;
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ role: 'admin', id: 0 }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: 'admin', username });
};

const workerLogin = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const [rows] = await pool.query(
    `SELECT w.*, l.name as local_name, l.address as local_address FROM workers w
     JOIN locals l ON w.local_id = l.id
     WHERE w.code = ? AND w.active = 1 AND w.deleted_at IS NULL`,
    [code]
  );
  if (!rows.length) return res.status(401).json({ error: 'Código inválido' });

  const worker = rows[0];

  // Clock in
  const [session] = await pool.query(
    'INSERT INTO work_sessions (worker_id, clock_in) VALUES (?, NOW())',
    [worker.id]
  );

  const token = jwt.sign(
    { role: 'worker', workerId: worker.id, localId: worker.local_id, sessionId: session.insertId },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    worker: { id: worker.id, name: worker.name, local_id: worker.local_id, local_name: worker.local_name, local_address: worker.local_address },
    sessionId: session.insertId,
  });
};

const workerLogout = async (req, res) => {
  const { sessionId } = req.user;
  if (sessionId) {
    await pool.query('UPDATE work_sessions SET clock_out = NOW() WHERE id = ? AND clock_out IS NULL', [sessionId]);
  }
  res.json({ message: 'Sesión cerrada' });
};

module.exports = { adminLogin, workerLogin, workerLogout };
