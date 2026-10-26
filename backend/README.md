# Backend inicial de MielWeb

API inicial con Express, SQLite y autenticación de administrador mediante cookie HttpOnly.

## 1. Requisitos
- Node.js LTS instalado.
- Desde esta carpeta, instalar dependencias con `npm install`.

## 2. Configuración
1. Copia `.env.example` y renombra la copia a `.env`.
2. Cambia `JWT_SECRET` por un secreto aleatorio de al menos 32 caracteres.
3. Cambia `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La contraseña debe ser única y tener al menos 14 caracteres.
4. No compartas ni subas `.env` a Git.

Para generar un secreto aleatorio con Node.js:
`node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`

## 3. Ejecutar
`npm run dev`

API por defecto: `http://localhost:3001`.

## Endpoints
- `GET /api/health` — comprobación.
- `GET /api/products` — catálogo público.
- `POST /api/auth/login` — inicia sesión de administrador.
- `GET /api/auth/me` — consulta la sesión.
- `POST /api/auth/logout` — cierra sesión.
- `POST /api/products` — crear producto; requiere administrador.
- `PUT /api/products/:id` — actualizar producto; requiere administrador.
- `DELETE /api/products/:id` — eliminar producto; requiere administrador.

## Nota importante
Este es el backend inicial, aún no está conectado al frontend React. La cookie y la autorización deben probarse y la API debe desplegarse detrás de HTTPS antes de producción. En producción, configura `NODE_ENV=production`, un `JWT_SECRET` seguro, credenciales de administrador únicas y un origen frontend exacto. SQLite guarda datos en el archivo local configurado; para una instalación con alta disponibilidad o varias instancias se debe evaluar una base de datos administrada y respaldos.
