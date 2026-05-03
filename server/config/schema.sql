CREATE DATABASE IF NOT EXISTS migajeros_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE migajeros_pos;

CREATE TABLE IF NOT EXISTS locals (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  address    VARCHAR(255),
  phone      VARCHAR(30),
  active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS workers (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(6) NOT NULL UNIQUE,
  local_id   INT UNSIGNED NOT NULL,
  active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (local_id) REFERENCES locals(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS work_sessions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id  INT UNSIGNED NOT NULL,
  clock_in   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clock_out  DATETIME,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,        -- precio de venta al cliente
  cost_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- costo de preparación (solo admin)
  category_id INT UNSIGNED,
  image_url   VARCHAR(255),
  available   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME DEFAULT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  local_id       INT UNSIGNED NOT NULL,
  worker_id      INT UNSIGNED NOT NULL,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status         ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('qr','cash','card') NOT NULL DEFAULT 'qr',
  notes          TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at        DATETIME,
  FOREIGN KEY (local_id)  REFERENCES locals(id)  ON DELETE RESTRICT,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoices (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id       INT UNSIGNED NOT NULL UNIQUE,
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  pdf_url        VARCHAR(255),
  generated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_local_created  ON orders(local_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_worker_created ON orders(worker_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_sessions_worker       ON work_sessions(worker_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_items_product         ON order_items(product_id);
-- Categorías de gastos
CREATE TABLE IF NOT EXISTS expense_categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  type       ENUM('fixed','ingredient','other') NOT NULL DEFAULT 'other',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Gastos registrados
CREATE TABLE IF NOT EXISTS expenses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED,
  local_id    INT UNSIGNED,
  description VARCHAR(255) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT (CURDATE()),
  notes       TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME DEFAULT NULL,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (local_id)    REFERENCES locals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_local   ON expenses(local_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at);

INSERT IGNORE INTO expense_categories (name, type) VALUES
  ('Alquiler',          'fixed'),
  ('Sueldos',           'fixed'),
  ('Servicios básicos', 'fixed'),
  ('Ingredientes',      'ingredient'),
  ('Empaques',          'ingredient'),
  ('Mantenimiento',     'other'),
  ('Otros',             'other');

CREATE INDEX IF NOT EXISTS idx_locals_deleted        ON locals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_workers_deleted       ON workers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_deleted      ON products(deleted_at);

INSERT IGNORE INTO categories (name) VALUES
  ('Paninis'),
  ('Bebidas'),
  ('Ensaladas'),
  ('Postres'),
  ('Extras');
