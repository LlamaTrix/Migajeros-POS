const pool = require('../config/db');

const generateWorkerCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const [rows] = await pool.query('SELECT id FROM workers WHERE code = ?', [code]);
    if (rows.length === 0) return code;
  }
  throw new Error('No se pudo generar un código único');
};

module.exports = { generateWorkerCode };
