require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/locals',   require('./routes/locals.routes'));
app.use('/api/workers',  require('./routes/workers.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/orders',   require('./routes/orders.routes'));
app.use('/api/reports',  require('./routes/reports.routes'));
app.use('/api/invoices', require('./routes/invoices.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Migajeros API corriendo en puerto ${PORT}`));
