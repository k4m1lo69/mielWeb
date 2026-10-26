# MielWeb

Sitio web para la presentación y venta de productos de miel natural. Los clientes eligen sus productos en un carrito y envían el pedido por WhatsApp. La administradora gestiona el catálogo desde un panel protegido con inicio de sesión.

## Tecnologías

- Frontend: React, Vite, JavaScript y CSS
- Backend: Node.js, Express y SQLite
- Chatbot de atención: Botpress (ver `docs/chatbot-instrucciones.md`)

## Requisitos

- Node.js 20.19 o superior, o 22.13 o superior
- npm
- Git

## Instalación

Clona el repositorio e instala las dependencias del frontend y del backend:

```bash
git clone https://github.com/k4m1lo69/mielWeb.git
cd mielWeb
npm install
cd backend
npm install
```

## Configuración del backend

1. Dentro de `backend/`, copia `.env.example` y nombra la copia `.env`.
2. Completa estos valores:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (por defecto 3001) |
| `NODE_ENV` | `development` o `production` |
| `FRONTEND_ORIGIN` | Origen exacto del frontend (en desarrollo, `http://localhost:5173`) |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres |
| `ADMIN_EMAIL` | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Contraseña única de al menos 14 caracteres |
| `DATABASE_PATH` | Ruta del archivo SQLite |

Para generar un secreto aleatorio:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

El archivo `.env` y la base de datos están excluidos de Git. Nunca los subas al repositorio.

El administrador se crea al iniciar el servidor por primera vez con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Si ya existe, el servidor no cambia su contraseña.

## Desarrollo

Abre dos terminales.

Terminal 1, API (puerto 3001):

```bash
cd backend
npm run dev
```

Terminal 2, sitio (puerto 5173):

```bash
npm run dev
```

Abre `http://localhost:5173` (no uses `127.0.0.1`: el backend valida ese origen exacto). Vite redirige las solicitudes de `/api` hacia el backend.

El acceso al panel de administración está en el pie de página, con el botón "Acceso administrador".

## Validación

Construye la versión de producción:

```bash
npm run build
```

Revisa el código con ESLint (frontend y backend):

```bash
npm run lint
```

## Estructura

```
src/                 Frontend (App.jsx, components/, utils/api.js)
backend/             API con Express y SQLite
backend/src/         Servidor, autenticación y base de datos
docs/                Documentación (instrucciones del chatbot)
```

## Flujo de trabajo con Git

- Una rama por tarea (`feat/...`, `fix/...`, `docs/...`, `chore/...`).
- Commits pequeños con mensajes Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Todo cambio llega a `main` mediante un Pull Request, con `npm run lint` sin errores.

## Estado del proyecto

Demo en desarrollo.

Funciona:
- Catálogo cargado desde la API.
- Carrito y envío del pedido por WhatsApp.
- Panel de administración con inicio de sesión para crear, editar y eliminar productos.
- Chatbot probado en el emulador de Botpress.

Pendiente:
- Reemplazar los productos de ejemplo por el catálogo real.
- Imágenes de productos.
- Secciones de beneficios y "Nosotros".
- Conectar el chatbot a WhatsApp Business.
- Despliegue en producción: requiere HTTPS, `NODE_ENV=production`, un `JWT_SECRET` seguro y credenciales únicas de administrador.

No hay pagos en línea: la disponibilidad, el depósito y la entrega se coordinan por WhatsApp.

## Repositorio

https://github.com/k4m1lo69/mielWeb