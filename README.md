# MielWeb

Tienda web para la presentación y comercialización de productos
apícolas. El proyecto incluye un catálogo de productos, un panel de
administración, una API propia, persistencia en SQLite y un flujo de
contacto/pedidos mediante WhatsApp.

## Estado del proyecto

El MVP está desplegado en AWS y operativo.

### Funcionalidades

-   Catálogo de productos obtenido desde la API.
-   Panel de administración para gestionar productos.
-   Carga y gestión de imágenes de productos.
-   Backend REST desarrollado con Node.js y Express.
-   Persistencia de datos mediante SQLite.
-   Formato de precios en pesos chilenos (CLP).
-   Acceso a pedidos y consultas mediante WhatsApp.
-   Chatbot integrado con Botpress.

## Tecnologías

  Área                                 Tecnología
  ------------------------------------ -------------------
  Frontend                             React
  Herramienta de desarrollo frontend   Vite
  Backend                              Node.js
  API                                  Express
  Base de datos                        SQLite
  Acceso a datos                       better-sqlite3
  Servidor web                         Nginx
  Infraestructura                      AWS EC2
  Acceso HTTPS público                 Cloudflare Tunnel
  Chatbot                              Botpress

## Estructura general

``` text
mielWeb/
├── backend/
│   ├── data/                 # Base de datos SQLite y respaldos (no versionar)
│   ├── scripts/              # Scripts auxiliares, incluido el respaldo de SQLite
│   ├── src/                  # Código del servidor y lógica de la API
│   ├── uploads/              # Archivos cargados (no versionar)
│   ├── .env                  # Configuración y secretos (no versionar)
│   └── package.json
├── src/
│   ├── assets/               # Recursos gráficos
│   ├── components/           # Componentes de React
│   ├── utils/                # Funciones auxiliares y cliente de API
│   ├── App.jsx
│   └── ...
├── index.html
├── package.json
└── README.md
```

La estructura puede variar ligeramente según la versión del repositorio.

## Requisitos para desarrollo local

-   Node.js (se recomienda una versión LTS compatible con las
    dependencias del proyecto).
-   npm.
-   Git.

## Instalación y ejecución local

Clona el repositorio:

``` bash
git clone https://github.com/k4m1lo69/mielWeb.git
cd mielWeb
```

Instala las dependencias del frontend:

``` bash
npm install
```

Instala las dependencias del backend:

``` bash
cd backend
npm install
```

Configura las variables de entorno del backend utilizando
`backend/.env.example` como referencia. Crea `backend/.env` localmente y
completa los valores correspondientes. No publiques este archivo ni
compartas sus secretos.

Después, inicia el backend en una terminal:

``` bash
cd backend
npm run dev
```

Inicia el frontend desde otra terminal, en la raíz del proyecto:

``` bash
npm run dev
```

Vite muestra en la terminal la dirección local para abrir la aplicación.
En la configuración de desarrollo, el frontend utiliza la API a través
de `/api`; el backend debe estar ejecutándose para que las funciones que
dependen de datos funcionen correctamente.

## Comandos disponibles

### Frontend (raíz del proyecto)

``` bash
npm run dev       # Servidor de desarrollo
npm run lint      # Revisión estática con ESLint
npm run build     # Compilación para producción
```

### Backend (`backend/`)

``` bash
npm run dev       # Servidor con reinicio automático al detectar cambios
npm start         # Inicio del servidor
```

## Variables de entorno

El backend utiliza un archivo `backend/.env`. Los nombres y valores
requeridos deben revisarse en `backend/.env.example` y en la
configuración del servidor.

Entre las variables de configuración utilizadas por el despliegue se
encuentran:

  Variable            Propósito
  ------------------- -----------------------------------------------------
  `PORT`              Puerto local del backend (en el despliegue: `3001`)
  `NODE_ENV`          Entorno de ejecución (`development` o `production`)
  `FRONTEND_ORIGIN`   Origen autorizado del frontend para CORS
  `DATABASE_PATH`     Ruta del archivo SQLite
  `ADMIN_EMAIL`       Correo de la cuenta administradora inicial
  `ADMIN_PASSWORD`    Contraseña inicial de administración
  `JWT_SECRET`        Secreto utilizado para firmar tokens

**Seguridad:** usa valores propios y robustos en cada entorno.
`JWT_SECRET` debe ser aleatorio y tener al menos 32 caracteres. La
contraseña inicial del administrador debe ser robusta y cumplir los
requisitos de validación del backend. Nunca incluyas secretos reales en
el repositorio, capturas, documentación pública o mensajes.

## Arquitectura de producción

El despliegue actual utiliza:

1.  **AWS EC2 (Amazon Linux 2023):** aloja la aplicación.
2.  **Nginx:** sirve los archivos compilados del frontend y deriva las
    solicitudes `/api/` al backend.
3.  **Backend Node.js:** ejecuta la API en `127.0.0.1:3001`, sin exponer
    directamente ese puerto a Internet.
4.  **SQLite:** almacena los datos de la aplicación en el servidor.
5.  **Cloudflare Tunnel:** proporciona acceso HTTPS público al sitio.

El backend se administra mediante `systemd` con el servicio
`mielweb-backend`. El túnel se administra mediante
`cloudflared-mielweb`.

### Consideración sobre la dirección pública

El despliegue utiliza actualmente un **Cloudflare Quick Tunnel**
(`trycloudflare.com`). Este tipo de dirección es temporal y puede
cambiar si se recrea el túnel. Para disponer de una dirección estable se
debe configurar un túnel de Cloudflare asociado a un dominio propio.

## Seguridad implementada

El backend incorpora varias medidas de protección, entre ellas:

-   Cabeceras de seguridad mediante Helmet.
-   Desactivación de la cabecera `X-Powered-By`.
-   Límite de tamaño para solicitudes JSON.
-   Restricción de CORS al origen configurado.
-   Validación del origen en solicitudes de modificación de la API.
-   Limitación de intentos de inicio de sesión.
-   Validación de datos de productos.
-   Límite de tamaño y validación de formato de imágenes.
-   Cookies de autenticación `HttpOnly` y configuración segura en
    producción.
-   Secretos y configuración sensible fuera del control de versiones.

La instancia también mantiene el backend enlazado a `127.0.0.1`, detrás
de Nginx.

## Respaldos de la base de datos

El proyecto cuenta con un respaldo automático de SQLite mediante un
servicio y temporizador de `systemd`:

-   Ejecución diaria a las **03:00 UTC**.
-   Copia consistente mediante la API de respaldo de SQLite
    (`better-sqlite3`), compatible con el uso de WAL.
-   Verificación de integridad de cada copia.
-   Retención de los últimos 7 respaldos.
-   Permisos restringidos para los archivos.
-   Bloqueo con `flock` para evitar ejecuciones simultáneas.
-   Temporizador habilitado para iniciar automáticamente después de
    reiniciar la instancia.

Los respaldos se guardan en:

``` text
backend/data/backups/
```

Servicios utilizados:

``` text
mielweb-db-backup.service
mielweb-db-backup.timer
```

El respaldo no sustituye una estrategia externa de recuperación ante
pérdida de la instancia. Se recomienda descargar periódicamente una
copia cifrada fuera de EC2 y realizar una prueba de restauración
controlada antes de depender de ella ante un incidente.

## Mantenimiento básico en AWS

Conectado a la instancia mediante EC2 Instance Connect:

Consultar el estado de los servicios:

``` bash
sudo systemctl is-active nginx mielweb-backend cloudflared-mielweb
```

Consultar el estado del backend:

``` bash
sudo systemctl status mielweb-backend --no-pager
```

Consultar los registros del backend:

``` bash
sudo journalctl -u mielweb-backend -n 100 --no-pager
```

Consultar el temporizador de respaldos:

``` bash
systemctl list-timers mielweb-db-backup.timer --no-pager
```

Ejecutar un respaldo manual:

``` bash
sudo systemctl start mielweb-db-backup.service
```

Consultar el resultado del último respaldo:

``` bash
sudo systemctl status mielweb-db-backup.service --no-pager
```

## Archivos y datos que no deben publicarse

No subas al repositorio:

-   `backend/.env` ni ningún archivo que contenga secretos.
-   `node_modules/`.
-   La base de datos real ni sus archivos `-wal` y `-shm`.
-   Respaldos de producción.
-   Archivos privados o credenciales de AWS.
-   Claves privadas, tokens o contraseñas.

Revisa `.gitignore` antes de realizar un commit. Mantén los datos de
producción y los respaldos fuera del repositorio.

## Repositorio

Código fuente:
[github.com/k4m1lo69/mielWeb](https://github.com/k4m1lo69/mielWeb)

------------------------------------------------------------------------

**MielWeb --- MVP de tienda web para productos apícolas.**
