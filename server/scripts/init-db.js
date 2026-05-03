require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '..', 'config', 'schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('✅ Base de datos inicializada correctamente');
  await conn.end();
}

init().catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
