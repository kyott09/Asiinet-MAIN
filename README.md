# Asiinet

Asiinet es un proyecto fullstack de gestión de servicios y tareas para un negocio de conectividad e internet por cable. El repositorio incluye una API REST en Node.js + Express y una interfaz web en React + Vite para gestionar usuarios, perfiles, solicitudes de servicio y tareas asignadas.

## Características

- Registro e inicio de sesión de usuarios.
- Autenticación con JWT almacenado en cookie HTTP-only.
- Gestión de perfil del usuario autenticado.
- Panel de tareas y solicitudes según el rol del usuario.
- Creación de solicitudes por parte de clientes con validación de servicio y descripción.
- Asignación de tareas a empleados operativos.
- Actualización de estado y fecha de finalización por parte del personal operativo.
- Restricción de acceso por roles y permisos.
- Vista de galería y navegación protegida por sesión.
- Configuración de base de datos MySQL con TypeORM.

## Tecnologías utilizadas

### Frontend

- React 19
- Vite 8
- React Router DOM 7
- @fortawesome/react-fontawesome
- CSS plano en componentes y páginas
- ESLint

### Backend

- Node.js
- Express 5
- TypeScript
- TypeORM
- MySQL (driver mysql2)
- JWT
- bcrypt
- Zod
- CORS
- dotenv
- nodemon
- tsx

### Base de datos

- MySQL
- TypeORM con `synchronize: true`
- Entidades de la aplicación: `User` y `Task`

### Herramientas de desarrollo

- npm
- Git
- VS Code
- TypeScript
- ESLint

## Estructura del proyecto

```text
Asiinet-MAIN/
├── back-asiinet/
│   ├── src/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   ├── utils/
│   │   └── index.ts
│   ├── .env
│   ├── .env_example
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   └── package-lock.json
├── front-asiinet/
│   └── asiinet/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       ├── eslint.config.js
│       ├── README.md
│       └── package-lock.json
├── CLAUDE_FRONTEND_BRIEF.md
├── README.md
├── package-lock.json
├── skills-lock.json
└── .git/
```

### Descripción de las carpetas principales

- `back-asiinet/src/`: código principal del backend.
- `back-asiinet/src/modules/`: módulos de usuarios y tareas.
- `back-asiinet/src/middlewares/`: autenticación, permisos y manejo de errores.
- `back-asiinet/src/database/`: configuración de la conexión a MySQL.
- `front-asiinet/asiinet/src/`: código de la aplicación React.
- `front-asiinet/asiinet/src/pages/`: páginas principales de la app.
- `front-asiinet/asiinet/src/components/`: componentes reutilizables.
- `front-asiinet/asiinet/src/routes/`: definición de rutas protegidas y públicas.

## Requisitos

Para ejecutar el proyecto, se necesita:

- Node.js con npm instalado.
- Un servidor MySQL disponible.
- Git para clonar el repositorio.
- Un navegador para usar la interfaz web.

## Instalación

### 1) Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Asiinet-MAIN
```

### 2) Instalar dependencias del backend

```bash
cd back-asiinet
npm install
```

### 3) Instalar dependencias del frontend

```bash
cd ../front-asiinet/asiinet
npm install
```

## Configuración

### Backend

El backend usa variables de entorno para la conexión a MySQL y la firma del JWT. El archivo real disponible es `back-asiinet/.env_example`.

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=empresa_db
DB_USER=root
DB_PASS=tu_password
JWT_SECRET=tu_clave_secreta
```

Se recomienda crear un archivo `.env` dentro de `back-asiinet` con esos valores antes de levantar la API.

> Al iniciar el backend se crean, si todavía no existen, una cuenta de administración, dos cuentas demo de cliente y dos de empleado. Las cuentas demo usan direcciones `@asiinet.com`; clientes reciben el rol `cliente` y empleados el rol canónico `operador` (alias de `empleado`). La contraseña inicial local para las cinco cuentas es `123456`; cambiar `INITIAL_ACCOUNTS_PASSWORD` en `back-asiinet/.env` si querés usar otra.

| Cuenta | Email | Rol |
| --- | --- | --- |
| Admin | `admin@asiinet.com` | `admin` |
| Cliente de prueba 1 | `cliente1.demo@asiinet.com` | `cliente` |
| Cliente de prueba 2 | `cliente2.demo@asiinet.com` | `cliente` |
| Empleado de prueba 1 | `empleado1.demo@asiinet.com` | `operador` |
| Empleado de prueba 2 | `empleado2.demo@asiinet.com` | `operador` |

Las cuentas se crean al iniciar **el backend** una vez que puede conectarse a MySQL; abrir solamente el frontend no puede escribir en la base de datos. El sembrado es idempotente: no duplica usuarios ni restablece las contraseñas existentes; si un rol demo se cambió manualmente, se corrige al reiniciar. `123456` es solo para desarrollo. En `NODE_ENV=production`, el backend requiere `INITIAL_ACCOUNTS_PASSWORD` con un valor distinto antes de arrancar.

### Frontend

La aplicación frontend usa `VITE_API_URL` si está definido; si no, en la página de tareas el valor por defecto es `http://localhost:8080`.

```env
VITE_API_URL=http://localhost:8080
```

## Ejecución

### Backend

```bash
cd back-asiinet
npm run dev
```

El servidor corre por defecto en:

```text
http://localhost:8080
```

También está disponible:

```bash
cd back-asiinet
npm start
```

### Frontend

```bash
cd front-asiinet/asiinet
npm run dev
```

La interfaz se ejecuta por defecto en:

```text
http://localhost:5174
```

### Scripts disponibles

#### Backend

```bash
npm run dev
npm start
npm test
npm run typecheck
```

#### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Funcionalidades actuales

### Autenticación y usuarios

- Registro de usuario.
- Inicio de sesión con email y contraseña.
- Generación de token JWT y almacenamiento en cookie.
- Cierre de sesión.
- Recuperación del usuario autenticado desde `/api/users/me`.
- Edición del perfil del usuario.
- Validación de roles al acceder a rutas protegidas.

### Gestión de tareas y solicitudes

- Listado de tareas según el usuario autenticado.
- Clientes pueden crear solicitudes de servicio.
- Operadores pueden ver tareas asignadas.
- Los empleados pueden actualizar `dueDate` y `status` de sus tareas.
- Los clientes pueden editar solo la descripción de sus propias solicitudes.
- La API valida que no se cree más de una solicitud activa del mismo tipo para un cliente cuando el estado no está finalizado.

### Rutas principales del backend

```text
POST /api/users/register
POST /api/users/login
POST /api/users/logout
GET /api/users/me
PUT /api/users/me
GET /api/users/assignables
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
```

## Roles y permisos

El proyecto define roles en la capa de autenticación y validación de permisos.

| Rol | Uso principal |
| --- | --- |
| `admin` | acceso administrativo general |
| `supervisor` | supervisión y gestión de tareas |
| `operador` | tareas asignadas a empleados |
| `cliente` | solicitudes de servicio propias |

La lógica actual normaliza aliases como `user`, `empleado`, `client` y `employee` hacia los nombres principales del sistema.

## Flujo general del sistema

1. El usuario crea una cuenta o inicia sesión en la aplicación frontend.
2. El backend valida credenciales, genera un JWT y lo devuelve mediante una cookie HTTP-only.
3. El frontend guarda la sesión del usuario en `sessionStorage` y protege rutas.
4. Las páginas de tareas y perfil consumen la API REST del backend.
5. El backend usa TypeORM para interactuar con MySQL.
6. Las entidades principales son `User` y `Task`, con relaciones entre cliente, empleado y tareas.
7. El middleware de autenticación valida permisos y acceso a cada tarea según el rol.

## Desarrollo

El repositorio está preparado para trabajar en dos partes separadas:

- `back-asiinet`: API y lógica de negocio.
- `front-asiinet/asiinet`: cliente web de React.

Durante el desarrollo, se usan estos comandos reales:

```bash
cd back-asiinet
npm run dev
npm test
npm run typecheck
```

```bash
cd front-asiinet/asiinet
npm run dev
npm run build
npm run lint
```

La base de datos se sincroniza automáticamente con `synchronize: true`, por lo que la estructura se crea localmente durante la inicialización del backend si la base está disponible.

## Capturas de pantalla

No se incluye una carpeta de assets o capturas de pantalla dentro del repositorio que pueda documentarse de forma confiable en este README. Por esa razón no se agregan imágenes inventadas.

## Nota sobre el repositorio

Este README se basa exclusivamente en la estructura y el código vigente del proyecto. No se agregan funcionalidades ni comandos que no estén presentes en `package.json`, en los archivos de configuración o en la implementación actual del sistema.
