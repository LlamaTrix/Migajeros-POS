# Panini's Migajeros - Sistema POS Completo

## Estructura del proyecto

```
Migajeros/
├── server/    → API Backend (Node.js + Express + MySQL) · Puerto 3001
├── admin/     → Panel de Administración (React + Vite)  · Puerto 5173
└── pos/       → Punto de Venta (React + Vite)           · Puerto 5174
```

## Requisitos previos

- Node.js v18+
- MySQL 8+
- npm

## Configuración inicial

### 1. Base de datos

```bash
# Edita server/.env con tus credenciales MySQL
cp server/.env.example server/.env
# Edita server/.env

# Inicializa la base de datos
cd server
npm run init-db
```

### 2. Instalar dependencias (si no están instaladas)

```bash
cd server && npm install
cd ../admin && npm install
cd ../pos && npm install
```

## Ejecutar el sistema

Abrir 3 terminales:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Admin
cd admin && npm run dev

# Terminal 3 - POS
cd pos && npm run dev
```

## Accesos

| Sistema | URL | Credenciales |
|---------|-----|--------------|
| Admin   | http://localhost:5173 | Usuario: `Migajeros_admin` / Contraseña: `LongaricHerbas.123!` |
| POS     | http://localhost:5174 | Código del trabajador (generado desde Admin) |

## Flujo de uso

1. **Admin**: Registrar locales → Registrar trabajadores (se genera código automático) → Agregar productos
2. **POS**: Ingresar con código de trabajador → Tomar orden → Seleccionar productos → Cobrar (QR) → Confirmar pago → Se genera factura PDF

## API Backend

- `POST /api/auth/admin/login` - Login admin
- `POST /api/auth/worker/login` - Login trabajador por código
- `GET/POST/PUT/DELETE /api/locals` - CRUD locales
- `GET/POST/PUT/DELETE /api/workers` - CRUD trabajadores
- `GET/POST/PUT/DELETE /api/products` - CRUD productos
- `POST /api/orders` - Crear orden
- `PATCH /api/orders/:id/confirm` - Confirmar pago
- `GET /api/orders/local/:id/today` - Órdenes del día por local
- `GET /api/reports/*` - Reportes de ventas
