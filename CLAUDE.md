# Asiinet — guía del proyecto para Claude

## Propósito y cómo usar esta guía

Este archivo describe la implementación que existe en el repositorio, no una hoja de ruta idealizada. Antes de cambiar código, inspeccioná los archivos de la sección correspondiente y verificá que los contratos sigan coincidiendo con esta guía. Si el código contradice este documento, prevalece el código vigente y se debe corregir la documentación cuando corresponda.

Para trabajo de interfaz, leer también [`CLAUDE_FRONTEND_BRIEF.md`](./CLAUDE_FRONTEND_BRIEF.md). Ese archivo aporta contexto de marca y experiencia de usuario; esta guía amplía ese contexto al backend, la API, la base de datos y las reglas por rol.

## Resumen del sistema

Asiinet es una aplicación web para organizar solicitudes de servicio y tareas de una empresa de conectividad. El repositorio contiene dos aplicaciones independientes:

- **Frontend:** React 19, JavaScript/JSX, React Router 7 y Vite 8, en `front-asiinet/asiinet/`.
- **Backend:** Node.js, TypeScript, Express 5, TypeORM y MySQL, en `back-asiinet/`.
- **Persistencia:** entidades `User` y `Task`, con sincronización de esquema de TypeORM (`synchronize: true`).
- **Autenticación:** JWT en cookie HTTP-only; el frontend además conserva el objeto público del usuario en `sessionStorage`.

No hay un workspace npm único que arranque ambas aplicaciones. Instalá dependencias y ejecutá comandos en la carpeta de cada aplicación.

## Estructura que importa

```text
Asiinet-MAIN/
├── CLAUDE.md
├── CLAUDE_FRONTEND_BRIEF.md
├── back-asiinet/
│   ├── src/
│   │   ├── database/                 # conexión TypeORM y usuarios iniciales
│   │   ├── middlewares/              # auth, roles, permisos y errores HTTP
│   │   ├── modules/user/             # entidad, rutas, controlador, servicio y repo de usuarios
│   │   ├── modules/task/             # entidad, rutas, controlador, servicio y repo de tareas
│   │   ├── utils/                    # utilidades Express
│   │   └── index.ts                  # punto de entrada usado por npm scripts
│   ├── .env_example
│   ├── package.json
│   └── tsconfig.json
└── front-asiinet/asiinet/
    ├── src/
    │   ├── assets/                   # fotos y recursos de marca
    │   ├── components/               # componentes compartidos
    │   ├── pages/                    # pantallas
    │   ├── routes/AppRoutes.jsx      # rutas públicas y protegidas
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

En el backend, cada módulo sigue generalmente el flujo **routes → controller → service → repository → TypeORM entity**. La validación del cuerpo de tareas está en el controlador con Zod; la autorización está distribuida entre middleware y servicio.

## Puesta en marcha local

Requisitos: Node.js/npm y una instancia MySQL accesible. Crear una base de datos vacía y configurar `back-asiinet/.env` a partir de los nombres de variables de `back-asiinet/.env_example`. No copiar secretos reales a este archivo, al repositorio ni a respuestas.

Variables que consume el backend:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP; el valor predeterminado en el código es `8080`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Conexión MySQL. |
| `JWT_SECRET` | Firma y verificación de JWT; debe configurarse. |
| `NODE_ENV` | En producción, habilita `secure` en cookie y exige contraseña inicial segura. |
| `INITIAL_ACCOUNTS_PASSWORD` | Contraseña inicial de cuentas creadas automáticamente. En desarrollo, si falta, el código usa `123456`; en producción no permite ausencia ni `123456`. |

Comandos, ejecutados desde cada carpeta:

```bash
# Backend
cd back-asiinet
npm install
npm run dev       # nodemon + tsx src/index.ts
npm test          # pruebas Node ejecutadas con tsx
npm run typecheck # tsc --noEmit
```

```bash
# Frontend
cd front-asiinet/asiinet
npm install
npm run dev       # http://localhost:5174
npm run build
npm run lint
npm run preview   # http://localhost:4173
```

Ambos lados usan `http://localhost:8080` como URL API predeterminada. El frontend puede sobrescribirla mediante `VITE_API_URL` (por ejemplo, en `front-asiinet/asiinet/.env.local`). Las páginas y componentes que consumen la API usan esta variable con ese fallback.

### Inicio de backend y cuentas de desarrollo

`back-asiinet/src/index.ts` inicializa MySQL, crea si hace falta `admin@asiinet.com` y ejecuta el sembrado de dos clientes (`cliente1@asiinet.com`, `cliente2@asiinet.com`) y dos operadores (`empleado1@asiinet.com`, `empleado2@asiinet.com`). El sembrado no duplica cuentas existentes y corrige el rol de esas cuentas sin restablecer sus contraseñas.

La contraseña predeterminada local `123456` es solo para desarrollo. El arranque de producción falla si `INITIAL_ACCOUNTS_PASSWORD` no está configurada o es `123456`. No documentar ni usar estas cuentas como credenciales de producción.

Los correos anteriores salen del código de sembrado y pueden diferir de los listados en README antiguos; tomar `src/index.ts` y `src/database/seed-default-users.ts` como fuente de verdad.

## Frontend: navegación y comportamiento

El punto de entrada es `src/main.jsx`; monta `App` dentro de `StrictMode`. `App.jsx` delega en `src/routes/AppRoutes.jsx`.

| Ruta | Pantalla | Estado/acceso |
| --- | --- | --- |
| `/` y `/login` | Login | Pública. |
| `/register` | Registro | Pública; envía `role: "user"` para registrar un usuario tipo cliente. |
| `/home` | Inicio | Requiere usuario en `sessionStorage`. |
| `/profile` | Perfil | Requiere sesión; carga y actualiza el perfil por API. |
| `/users` | Usuarios | Protegida en frontend para `role === "admin"`; permite listar, crear, editar y eliminar cuentas mediante la API. |
| `/galeria` | Galería | Requiere sesión; muestra imágenes locales. |
| `/tareas` | Tareas/solicitudes | Requiere sesión; CRUD y vistas dependen del rol. |

No hay ruta catch-all/404 definida. No se debe asumir que otros enlaces implican pantallas implementadas: vehículos, empleados, roles, calendario y documentación no tienen rutas activas en el router.

### Estado de sesión en navegador

- Login hace `POST /api/users/login`, manda `credentials: "include"` y guarda `data.user` en `sessionStorage` con clave `user`.
- Las rutas protegidas consultan ese valor localmente para renderizar; cada request autenticado del backend valida el JWT y obtiene el rol actual desde la base.
- Las solicitudes autenticadas deben usar `credentials: "include"` para enviar la cookie.
- La página de perfil sincroniza el usuario tras leerlo o actualizarlo y emite el evento `asiinet:user-updated`; `AccountActions` escucha ese evento y el evento `storage`.
- Logout llama `POST /api/users/logout` e igualmente limpia el estado local si la petición falla.
- Ante ciertos `401` (perfil/tareas), la interfaz borra `user` y redirige a `/login`.

### Pantallas y componentes principales

- `src/pages/Login.jsx`, `Register.jsx`: formularios y componentes comunes en `components/auth/`.
- `src/pages/Home.jsx`: introducción y servicios; no es un tablero de métricas de la API.
- `src/pages/Profile.jsx`: perfil, incluido `fotoPerfil` como Data URL leído en el navegador.
- `src/pages/Tareas.jsx`: listado, búsqueda/filtro, formularios, confirmación de borrado, tabla y representación para móvil.
- `src/pages/Users.jsx`: gestión administrativa de usuarios, con tabla adaptable, alta, edición de nombre/email/rol y borrado confirmado.
- `src/pages/Gallery.jsx`: carrusel local con `foto1.jpg`, `foto2.jpg` y `foto3.jpg`; controles y puntos están en `components/gallery/`.
- `components/dashboard/DashboardSidebar.jsx` y `AccountActions.jsx`: navegación y cuenta compartidas por las páginas del panel.
- Estilos globales en `src/index.css` y `src/App.css`; estilos específicos junto a páginas/componentes. Mantener los patrones CSS existentes antes de sumar un sistema nuevo.

La identidad visual actual usa logos en `src/assets/brand/`, acentos naranjas y superficies claras. Reutilizar los recursos existentes y mantener responsive, estados accesibles, etiquetas, foco visible y controles descriptivos. No inventar listas o resultados persistidos para que una pantalla parezca conectada.

## Backend: arranque, CORS y errores

El entry point usado por scripts es `back-asiinet/src/index.ts` (`src/index.js` no es el entry point de los scripts actuales). Carga dotenv y `reflect-metadata`, configura Express, conecta la base, crea cuentas iniciales y escucha en `PORT` o `8080`.

CORS permite credenciales y actualmente acepta orígenes localhost `5173`, `5174` y `5175` (además de peticiones sin `Origin`). El Vite actual sirve en `5174`. Antes de desplegar en otro dominio hay que revisar y configurar la lista en `src/index.ts`; no asumir que existe un proxy de Vite.

Las rutas se montan en `/api/users` y `/api/tasks`. `notFoundHandler` y `errorHandler` devuelven errores JSON; los errores de aplicación tienen forma `{ status: "error", code, message }`. Controladores asíncronos usan `asyncHandler`.

## API implementada

Todas las rutas, salvo que se indique, están bajo `/api`. Las rutas de usuarios están bajo `/users` y las de tareas bajo `/tasks`.

| Método y ruta | Auth | Función y forma relevante |
| --- | --- | --- |
| `POST /users/register` | No | Recibe `{ email, password, role?, nombre? }`; devuelve el usuario sin hash de contraseña. El frontend público envía `role: "user"`, normalizado a `cliente`. |
| `POST /users/login` | No | Recibe `{ email, password }`; devuelve `{ token, user }` y también fija la cookie `token`. La cookie es HTTP-only, SameSite Lax, dura una hora y es `Secure` solo con `NODE_ENV=production`. |
| `POST /users/logout` | No | Limpia la cookie `token`. |
| `GET /users/me` | Sí | Devuelve `{ user }` del usuario del JWT. |
| `PUT /users/me` | Sí | Actualiza `nombre`, `email`, `fechaNacimiento`, `domicilio` y `fotoPerfil`; devuelve `{ message, user }`. |
| `GET /users/assignables` | Sí + `users:read` | Devuelve `{ clients, employees }`, con elementos `{ id, nombre, email }`. Solo alimenta los selectores de tareas; no es una API general de administración. |
| `GET /users/admin-only` | Sí + rol admin | Endpoint de comprobación de acceso administrativo. |
| `GET /users` | Sí + `users:write` | Solo admin. Devuelve `{ users }` con `id`, `nombre`, `email`, `role` y `creadoEn`; nunca incluye `passwordHash`. |
| `POST /users` | Sí + `users:write` | Alta administrativa con `{ nombre, email, password, role }`; valida rol y contraseña de 8–72 bytes UTF-8, devuelve `{ user }` sin hash. |
| `PUT /users/:id` | Sí + `users:write` | Actualiza únicamente `nombre`, `email` y/o `role`; devuelve `{ user }` sin hash. Protege al último admin y los roles compatibles con asignaciones de tareas. |
| `DELETE /users/:id` | Sí + `users:write` | Elimina un usuario sin tareas asociadas; no permite autoeliminación ni eliminar al último admin. Devuelve `{ message }`. |
| `GET /tasks` | Sí + `tasks:read` | Devuelve `{ tasks }`, filtradas por visibilidad del rol. |
| `POST /tasks` | Sí + `tasks:create` | Crea tarea/solicitud; devuelve `{ task }` con HTTP 201. |
| `PUT /tasks/:id` | Sí + `tasks:update` + acceso a esa tarea | Actualiza campos permitidos según rol; devuelve `{ task }`. |
| `DELETE /tasks/:id` | Sí + `tasks:delete` + acceso | Elimina y devuelve `{ message: "Tarea eliminada" }`. |

La cookie se lee directamente desde `Cookie` por el middleware; el cliente no necesita ni debe mover el token a `localStorage`. El frontend guarda localmente solo la representación pública del usuario para renderizar/navegar. `requireAuth` consulta la fila del usuario en cada request autenticado y usa el email/rol actuales de la base; un usuario borrado recibe 401 aunque su JWT aún no haya vencido. El JWT conserva la expiración de una hora y su contrato no cambia.

El registro público fija siempre `role: "cliente"` en el controlador e ignora el valor enviado por el frontend. El backend del registro público todavía no impone longitud de contraseña; el formulario actual requiere seis caracteres. No se debe asumir que esa validación de interfaz reemplaza una validación de servidor. El alta administrativa impone entre 8 y 72 bytes UTF-8, sin reglas de complejidad.

Aunque el archivo de ejemplo puede contener `JWT_EXPIRES_IN`, el servicio de login firma actualmente el JWT con una expiración fija de una hora; no lee esa variable.

## Roles, permisos y aislamiento de tareas

Roles canónicos: `admin`, `supervisor`, `operador`, `cliente`. Alias normalizados por el backend: `user` y `client` → `cliente`; `empleado` y `employee` → `operador`.

Permisos declarados en `middlewares/auth.ts`:

| Rol | Permisos generales |
| --- | --- |
| `admin` | Usuarios leer/escribir; tareas leer/crear/actualizar/eliminar; galería leer. |
| `supervisor` | Usuarios leer; tareas leer/crear/actualizar; galería leer. |
| `operador` | Tareas leer/crear/actualizar; galería leer. |
| `cliente` | Usuarios leer; tareas leer/crear/actualizar; galería leer. |

El permiso general no reemplaza las comprobaciones por recurso:

- **Admin:** puede acceder a cualquier tarea y eliminarla.
- **Supervisor:** puede leer/actualizar tareas; no puede eliminarlas.
- **Operador:** solo puede leer tareas asignadas a su `employeeId`; actualiza solo las que tiene asignadas y puede cambiar únicamente fecha de finalización y estado.
- **Cliente:** solo ve tareas asociadas a su `clientId`; puede crear una solicitud y editar únicamente la descripción de sus propias solicitudes. No puede eliminarlas.

La API de tareas filtra las listas en el servicio; `requireTaskAccess` además comprueba la tarea concreta al actualizar o borrar. No confiar solo en el filtrado de frontend ni debilitar middleware para resolver un problema visual.

El listado administrativo completo usa `users:write` (solo admin); `users:read` no permite enumerar todas las cuentas. `GET /users/assignables` conserva su permiso y contrato actuales.

Para proteger al último administrador, las operaciones de cambio de rol/borrado ejecutan una transacción que bloquea con `pessimistic_write` las filas de administradores antes de contar. No se puede quitar el propio rol de admin ni eliminar la propia cuenta. El borrado se rechaza si el usuario figura como cliente u operador de una tarea, porque esas relaciones usan `onDelete: SET NULL`; los cambios de rol que contradicen asignaciones existentes también se rechazan. No existe cambio de contraseña propio ni restablecimiento administrativo.

## Reglas y datos de tareas

Entidad TypeORM `Task` en tabla `tareas`. Campos principales: `id`, texto `client`/`employee`, relaciones opcionales con usuarios a través de `clientId`/`employeeId`, `createdAt`, `dueDate`, `description`, `service`, `priority` y `status`. La API administrativa impide eliminar usuarios con referencias a tareas antes de que aplique el `onDelete: SET NULL`.

- Servicios aceptados: `Instalación`, `Reconexión`, `Servicio técnico`, `Desconexión`.
- Prioridad: `Baja`, `Media`, `Alta`.
- Estados usados por la UI/API: `Vista`, `En proceso`, `Terminada`, `No terminada`. La API normaliza algunos alias heredados como `finalizada`/`finalizado` a `Terminada`.
- Fechas de API son cadenas `YYYY-MM-DD`; Zod valida que sean fechas reales.
- Fecha de finalización no puede anteceder a la fecha de creación.
- Para cliente, la creación fija el propio `clientId`, estado inicial `Vista`, prioridad `Baja` y deja `employeeId`/`dueDate` sin asignar; no se asigna automáticamente un operador.
- Un cliente no puede mantener dos solicitudes activas del mismo servicio. El backend considera finalizados los estados `terminada`, `finalizada` y `finalizado`.
- Supervisor/admin crean tareas seleccionando un usuario cliente y un operador existentes. El servicio comprueba roles válidos (`cliente` y `operador`).
- Para operador, el backend exige asignación del cliente y del empleado al crear; no obstante, la interfaz actual no ofrece creación de tarea a operadores.
- El listado serializado expone `id` y `number` (ambos basados en el ID), cliente/empleado, IDs, fechas y detalles de tarea.

Las validaciones por rol difieren: no agregar campos a los payloads del cliente/operador sin modificar y probar los esquemas correspondientes. Cliente crea con `description` y `service`, y edita solo `description`; operador edita `dueDate` y `status`; otros roles usan el payload más amplio de tarea.

## Base de datos y modelo de usuario

`database/data-source.ts` conecta a MySQL mediante `mysql2` y registra las entidades `User`/`Task`. `synchronize: true` sincroniza el esquema al iniciar; no hay migraciones TypeORM configuradas en el proyecto. Es conveniente para el entorno actual, pero los cambios de esquema requieren cautela antes de usarse con datos de producción.

Entidad `User` en tabla `usuarios`: `id`, `nombre`, `email` único, `passwordHash`, `role`, `fechaNacimiento`, `domicilio`, `fotoPerfil` y `creadoEn`. Las contraseñas se guardan con bcrypt; nunca serializar `passwordHash` en respuestas. El perfil permite almacenar una imagen como Data URL en `fotoPerfil`; considerar tamaño/base de datos antes de cambiar este comportamiento.

## Límites funcionales: no presentar como implementado

- Vehículos, cuadrillas, empleados como módulo independiente, stock/materiales, mantenimiento, métricas/rendimiento, calendario y documentación.
- Rutas de frontend distintas a las de la tabla de navegación.
- Cualquier dato ficticio que se presente como proveniente de API.

La pantalla Inicio describe el dominio y funciones futuras. La galería usa recursos estáticos, no un endpoint.

## Pruebas y archivos de pruebas

Backend: pruebas `node:test` ejecutadas con `tsx`, con cobertura actual en autenticación, sembrado de usuarios, servicio de usuarios y controlador de tareas (`*.test.ts`). Usar `npm test` y `npm run typecheck` desde `back-asiinet`.

Frontend: no hay script de tests en `package.json`; validar cambios con `npm run build` y `npm run lint` desde `front-asiinet/asiinet`. Si el cambio toca estilos o interacción visual, comprobar también el flujo en navegador cuando sea posible.

## Convenciones para cambios asistidos por Claude

1. Leer primero los componentes/rutas/servicios reales relacionados con el pedido; buscar usos antes de cambiar una interfaz o contrato.
2. Hacer cambios acotados siguiendo módulos, nombres y CSS existentes; evitar refactorizaciones no solicitadas.
3. Preservar permisos en backend y `credentials: "include"` en llamadas autenticadas.
4. No inventar endpoints, persistencia, campos de modelo ni roles. Si hace falta cambiar el contrato, actualizar ambos extremos y pruebas/documentación.
5. Manejar errores y sesiones vencidas de forma explícita; no convertir fallos de API en respuestas de éxito ni datos de ejemplo.
6. No imprimir, copiar ni versionar `.env`, cookies, tokens, contraseñas o datos personales. El `.env` real queda fuera de la documentación.
7. Antes de finalizar, ejecutar la validación más pequeña relevante y resumir archivos modificados, decisiones y comandos/resultado de pruebas.
8. Los mensajes de commit se escriben en español, con prefijo convencional (feat, fix, test, docs, style) y sin trailers Co-authored-by.
