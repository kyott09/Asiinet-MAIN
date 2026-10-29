# Roles, autenticación y permisos

## 1. Visión general y arquitectura de seguridad

El backend expone una API REST construida con Express. La autenticación se realiza con JWT firmado y transmitido en una cookie llamada `token`; la autorización combina permisos asociados a roles (RBAC) con comprobaciones de propiedad y asignación sobre recursos concretos.

El flujo habitual de una ruta protegida es:

1. `requireAuth` obtiene el JWT de la cookie, valida la firma y la expiración y comprueba que el usuario todavía exista en MySQL.
2. `requirePermission(...)` o `requireRole(...)` verifica el acceso general al endpoint.
3. Cuando corresponde, un control específico de tarea o evento comprueba la relación entre el usuario y el recurso.
4. El controlador y el servicio validan el payload y aplican las reglas de negocio.

Por lo tanto, tener un permiso general —por ejemplo `tasks:update`— no alcanza para operar sobre cualquier tarea. La autorización se vuelve a comprobar según rol, identificador de usuario y asignaciones. La lista de tareas también se filtra en el servicio según el rol.

Los middlewares compartidos están en `src/middlewares/auth.ts`; las rutas de usuarios, tareas y eventos se definen, respectivamente, en `src/modules/user/user.routes.ts`, `src/modules/task/task.routes.ts` y `src/modules/event/event.routes.ts`. El punto de entrada monta esos routers bajo `/api/users`, `/api/tasks` y `/api/events`.

> **Alcance real:** no todas las rutas de la API están protegidas. En la implementación actual, las rutas CRUD de marcas, modelos de vehículos y vehículos no aplican `requireAuth`, `requirePermission` ni `requireRole`. Este documento describe ese estado; no implica que dichos endpoints deban permanecer públicos. Revisar y decidir su política de acceso antes de exponerlos fuera de un entorno controlado.

## 2. Stack tecnológico utilizado

| Tecnología o concepto | Uso en el backend |
| --- | --- |
| **Node.js y TypeScript** | Runtime y lenguaje del servidor. Los scripts actuales ejecutan `src/index.ts` mediante `tsx`. |
| **Express 5** | Enrutamiento HTTP y pipeline de middlewares. `asyncHandler` adapta controladores asíncronos y el middleware central convierte errores en respuestas JSON. |
| **`jsonwebtoken`** | Firma y verificación del JWT. `JWT_SECRET` es obligatorio para iniciar sesión y validar sesiones. El servicio fija una expiración de una hora; no lee `JWT_EXPIRES_IN`. |
| **Cookie HTTP-Only** | El controlador de login devuelve una cookie `token` con `httpOnly: true`, `sameSite: "lax"`, `path: "/"` y duración de una hora. `secure` se activa únicamente cuando `NODE_ENV === "production"`. |
| **`bcrypt`** | Comparación de hashes durante el login (`bcrypt.compare`) y creación de hashes (`bcrypt.hash`) con factor de trabajo `10`. El proyecto no usa `bcryptjs`. |
| **TypeORM y MySQL (`mysql2`)** | Persistencia del usuario en `usuarios`, relaciones con tareas y persistencia de eventos. `User.role` se guarda como texto `varchar`, no como un enum de base de datos. La configuración actual usa `synchronize: true`. |
| **Middlewares propios de Express** | `requireAuth` autentica; `requireRole` comprueba roles; `requirePermission` comprueba permisos; `requireTaskAccess` aplica autorización por tarea. |
| **Zod** | Validación de los payloads de tareas y eventos. Las reglas específicas por rol se eligen en el controlador de tareas. |
| **CORS** | Permite credenciales y restringe los orígenes de navegador a `http://localhost:5173`, `:5174` y `:5175` (además de requests sin `Origin`). No reemplaza la autenticación ni la autorización. |
| **`dotenv`** | Carga la configuración del entorno, incluida `JWT_SECRET` y las variables de conexión a la base. |

### Cookies, XSS y CSRF: alcance de las protecciones

`HttpOnly` impide que JavaScript lea directamente el valor de la cookie. No evita por sí solo que un XSS ejecute acciones en nombre del usuario desde el navegador comprometido. `SameSite=Lax` reduce ciertos escenarios de envío de cookies entre sitios, pero no equivale a una protección CSRF completa. No se observa un token CSRF dedicado en el backend. CORS limita qué orígenes de navegador pueden leer respuestas con credenciales, pero no es un control de autorización ni bloquea por sí mismo todas las solicitudes que pueden originar otros clientes.

Además, el endpoint de login devuelve `{ token, user }` en el cuerpo JSON **y** fija la cookie. Por eso, aunque el flujo autenticado usa la cookie, el JWT también está presente en la respuesta accesible al código cliente. No se debe describir la implementación como si el token existiera exclusivamente en una cookie inaccesible a JavaScript.

En producción, la cookie se marca `Secure`; fuera de producción no. El despliegue debe usar HTTPS y revisar la configuración de `NODE_ENV`, CORS y cookies. El backend lee la cabecera `Cookie` con un parser propio; no depende de `cookie-parser`.

## 3. Roles definidos en el sistema

Los roles canónicos que reconoce el código son:

| Rol canónico | Alcance principal |
| --- | --- |
| `cliente` | Consulta las tareas asociadas a su cuenta, crea solicitudes y actualiza la descripción de sus propias solicitudes. No tiene permisos de calendario ni de administración global. |
| `operador` | Consulta las tareas que tiene asignadas, puede crear tareas según el endpoint y actualizar la fecha de finalización opcional y el estado de las tareas que tiene asignadas. Puede leer y gestionar eventos de calendario, con la restricción de propiedad para modificarlos o borrarlos. |
| `supervisor` | Acceso amplio a lectura y gestión de tareas, salvo el borrado. Puede consultar y gestionar eventos de calendario, siempre sujeto a la regla de que cada evento solo lo modifica o elimina su creador. No administra el listado completo de usuarios. |
| `admin` | Acceso global a los permisos declarados, incluida la administración de usuarios y el borrado de tareas. En eventos, el rol admin no anula la regla de propiedad: solo el creador puede modificar o eliminar un evento. |

### Alias y normalización

El backend normaliza los siguientes alias antes de evaluar permisos:

| Valor recibido o almacenado | Rol normalizado |
| --- | --- |
| `user`, `client` | `cliente` |
| `empleado`, `employee` | `operador` |
| `cliente`, `operador`, `supervisor`, `admin` | Se conserva como rol canónico |

`gerente` y `técnico` **no** son roles canónicos ni alias implementados. Para un valor vacío, `normalizeRole` usa `cliente`; un rol desconocido se conserva, pero no obtiene permisos de `ROLE_PERMISSIONS`. El acceso público de registro fuerza `cliente`, aunque el servicio de registro pueda normalizar otros roles cuando se invoca con otro origen.

La entidad `User` tiene un campo `role` de texto y un valor por defecto heredado (`user`), que al autorizar se normaliza a `cliente`. El sembrado de cuentas iniciales crea un administrador y cuentas de demo cliente/operador; no debe inferirse de esas cuentas una lista de credenciales de producción.

### Matriz de permisos generales

Los permisos declarados en `ROLE_PERMISSIONS` son:

| Permiso | `admin` | `supervisor` | `operador` | `cliente` |
| --- |:---:|:---:|:---:|:---:|
| `users:read` | Sí | Sí | No | Sí |
| `users:write` | Sí | No | No | No |
| `tasks:read` | Sí | Sí | Sí | Sí |
| `tasks:create` | Sí | Sí | Sí | Sí |
| `tasks:update` | Sí | Sí | Sí | Sí |
| `tasks:delete` | Sí | No | No | No |
| `gallery:read` | Sí | Sí | Sí | Sí |
| `calendar:read` | Sí | Sí | Sí | No |
| `calendar:write` | Sí | Sí | Sí | No |

`gallery:read` forma parte del mapa general de permisos, aunque en las rutas del backend inspeccionadas no hay un endpoint de galería montado. `users:read` tampoco habilita el listado completo de usuarios: ese listado exige `users:write`; `users:read` se usa para obtener usuarios asignables.

## 4. Funcionamiento técnico paso a paso

### 4.1 Registro y almacenamiento de contraseñas

1. `POST /api/users/register` es público y el controlador llama al servicio fijando el rol `cliente`; ignora cualquier rol que intente enviar el cliente.
2. El servicio verifica que el email no exista y genera el hash con `bcrypt.hash(password, 10)`.
3. La entidad persiste el hash en `passwordHash`, no la contraseña en texto plano.
4. La respuesta de registro serializa los datos públicos del usuario y no incluye `passwordHash`.

El registro público no impone actualmente una longitud mínima/máxima de contraseña en servidor. En cambio, la creación administrativa valida entre 8 y 72 **bytes UTF-8** antes de hashear. No asumir que una validación del frontend protege el endpoint público.

### 4.2 Autenticación: login y JWT

1. El cliente envía `email` y `password` a `POST /api/users/login`.
2. El servicio busca al usuario por email y compara la contraseña recibida con `passwordHash` mediante `bcrypt.compare`.
3. Si las credenciales son correctas, exige `JWT_SECRET` y firma un JWT con los claims de aplicación `id`, `email` y `role` normalizado. `jsonwebtoken` agrega los claims temporales de emisión y expiración.
4. El JWT vence en una hora (`expiresIn: "1h"`).
5. El controlador fija la cookie `token` con `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge` de una hora y `secure` únicamente en producción.
6. El endpoint responde con HTTP 201 y un JSON `{ token, user }`. El objeto público de usuario no incluye el hash.

Si falta `JWT_SECRET`, el login falla con un error interno y las rutas autenticadas también rechazan la petición; la clave no tiene un valor predeterminado seguro en código. La variable `JWT_EXPIRES_IN` no modifica la expiración fija del token actual.

`POST /api/users/logout` limpia la cookie usando los mismos atributos relevantes (`httpOnly`, `sameSite`, `secure`, `path`). Como los JWT no se mantienen en una lista de revocación, el borrado del lado cliente elimina la cookie, pero no invalida criptográficamente un token copiado previamente antes de su expiración.

### 4.3 Autenticación en requests posteriores

1. `requireAuth` separa las cookies de la cabecera `Cookie` y busca `token`.
2. Verifica la firma y expiración con `JWT_SECRET`. Rechaza tokens inválidos y también tokens cuyo claim `id` no sea un entero seguro.
3. Busca al usuario actual por ese `id` en MySQL. Si la cuenta ya no existe, responde como no autenticado.
4. Construye `req.user` con el `id`, `email` y `role` actuales de la base. El middleware **no confía en el `email` ni en el `role` incluidos en el JWT para autorizar**; el rol se normaliza a partir del usuario actual.
5. El middleware siguiente aplica el control de rol o permiso y, cuando la ruta lo requiere, el control del recurso.

Esto combina un token firmado con una comprobación de cuenta en base de datos por request: el JWT lleva identidad y caducidad, pero los cambios de rol de la base se aplican en requests siguientes sin esperar a que venza el claim de rol.

### 4.4 Autorización por rol, permiso y recurso

- `requireRole(...roles)` compara el rol actual normalizado con una lista permitida. Se usa, por ejemplo, en `GET /api/users/admin-only`.
- `requirePermission(...permisos)` busca cada permiso en el mapa RBAC. Si falta alguno, responde 403. `hasPermission` considera autorizado a `admin` para cualquier permiso solicitado.
- `requireTaskAccess("update" | "delete")` valida el identificador, carga la tarea y aplica `canAccessTask` con el usuario y la acción solicitada.
- El servicio de tareas filtra también el listado: admin y supervisor ven todas; operador ve tareas con su `employeeId`; cliente ve tareas con su `clientId`.
- El servicio de eventos permite leer el calendario a los roles habilitados, marca `esPropio` y solo autoriza actualizar/eliminar cuando `creadorId` coincide con el usuario. Ser admin no omite esta regla.

### 4.5 Restricciones de administración de usuarios

Los endpoints de listado, alta, edición y borrado de usuarios exigen `users:write`, permiso que actualmente solo tiene `admin`. La capa de servicio también:

- limita los roles asignables a `admin`, `supervisor`, `operador` y `cliente`;
- valida los campos aceptados y evita devolver `passwordHash`;
- impide que un administrador se quite su propio rol de admin o se elimine a sí mismo;
- protege al último administrador en cambios de rol y borrado, con una transacción que bloquea filas de admins mediante `pessimistic_write`;
- rechaza cambios de rol incompatibles con asignaciones existentes y el borrado de cuentas con tareas asociadas.

## 5. Ejemplos reales de integración en rutas

Los fragmentos siguientes reflejan el orden de middlewares y las rutas del proyecto:

```ts
// src/modules/user/user.routes.ts
router.post("/login", userController.login); // pública
router.get("/me", requireAuth, userController.getCurrentUser);
router.get("/admin-only", requireAuth, requireRole("admin"), userController.adminOnly);
router.get("/", requireAuth, requirePermission("users:write"), userManagementController.listUsers);
```

Como el router de usuarios está montado en `/api/users`, los ejemplos corresponden a `POST /api/users/login`, `GET /api/users/me`, `GET /api/users/admin-only` y `GET /api/users/`.

```ts
// src/modules/task/task.routes.ts
router.get("/", requireAuth, requirePermission("tasks:read"), taskController.getAll);
router.post("/", requireAuth, requirePermission("tasks:create"), taskController.create);
router.put(
  "/:id",
  requireAuth,
  requirePermission("tasks:update"),
  requireTaskAccess("update"),
  taskController.update
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("tasks:delete"),
  requireTaskAccess("delete"),
  taskController.remove
);
```

En `PUT /api/tasks/:id`, el permiso general permite pasar a los roles habilitados, pero `requireTaskAccess` restringe la tarea y el servicio limita los campos editables: cliente solo puede cambiar descripción; operador, fecha y estado; supervisor/admin aplican la edición más amplia. Para borrar, solo `admin` tiene `tasks:delete`, y además se ejecuta el control del recurso.

Las solicitudes de cliente se crean sin operador. Admin/supervisor pueden editar esos registros manteniéndolos sin asignación mientras el estado resultante sea `Vista`; si el estado resultante es otro, se debe asignar un operador. Una tarea con operador ya asignado no permite quitarlo. La creación administrativa siempre requiere un operador.

Cliente puede asignar una visita opcional al crear enviando juntos `visitDate` (`YYYY-MM-DD`) y `visitTimeSlot` (`manana`, `tarde` o `noche`); sin visita, ambos campos quedan `null` y la interfaz muestra `A coordinar`. Admin/supervisor pueden asignar, cambiar o quitar la visita al crear y editar, cualquiera sea el estado. En `PUT`, omitir ambos conserva la visita existente; `null` en ambos la quita; ambos completos asignan o reprograman. Un par incompleto devuelve `400`. Una visita nueva o fecha cambiada no puede ser anterior al día actual de `America/Argentina/Buenos_Aires`; editar otros campos conserva una visita pasada ya existente. El cliente conserva un `PUT` limitado a `{ description }`; operador recibe `400` si envía campos de visita o `serviceDetails`.

```ts
// src/modules/event/event.routes.ts
router.get("/", requireAuth, requirePermission("calendar:read"), getEvents);
router.post("/", requireAuth, requirePermission("calendar:write"), createEvent);
router.put("/:id", requireAuth, requirePermission("calendar:write"), updateEvent);
router.delete("/:id", requireAuth, requirePermission("calendar:write"), deleteEvent);
```

Las operaciones de escritura de eventos vuelven a verificar en el servicio que la persona autenticada sea quien creó ese evento. Los permisos generales habilitan calendario a admin, supervisor y operador, pero no a cliente.

## 6. Rutas y consideraciones de seguridad actuales

| Área | Controles observados |
| --- | --- |
| `/api/users` | Registro/login/logout públicos; perfil requiere autenticación; asignables usa `users:read`; administración global requiere `users:write`; `admin-only` requiere rol admin. |
| `/api/tasks` | Todas las rutas requieren autenticación y permiso. Actualización y borrado agregan comprobación por tarea; el listado se filtra por rol en el servicio. |
| `/api/events` | Todas las rutas requieren autenticación y permiso de calendario. Actualización y borrado exigen además ser el creador. |
| `/api/brands`, `/api/vehicle-models`, `/api/vehicles` | Las rutas CRUD actuales no tienen middleware de autenticación/autorización. Evaluar el acceso esperado antes de desplegarlas públicamente. |

Los rechazos generados como `AppError` se serializan con HTTP acorde al error y un cuerpo `{ status: "error", code, message }`. En particular, credenciales o sesión inválidas generan 401 y la falta de permisos genera 403. Los errores inesperados se registran en el servidor y se responden con un mensaje genérico 500.

## 7. Archivos de referencia

- `src/middlewares/auth.ts`: roles, permisos, normalización, sesión JWT y acceso a tareas.
- `src/modules/user/user.controller.ts` y `src/modules/user/user.service.ts`: registro, login, JWT y perfil.
- `src/modules/user/user.entity.ts`: entidad persistida de usuario.
- `src/modules/user/user-management.service.ts` y `src/modules/user/user-management.repository.ts`: administración de usuarios y protecciones transaccionales.
- `src/modules/task/task.routes.ts`, `src/modules/task/task.controller.ts` y `src/modules/task/task.service.ts`: autorización y reglas de tareas.
- `src/modules/event/event.routes.ts`, `src/modules/event/event.controller.ts` y `src/modules/event/event.service.ts`: permisos y propiedad de eventos.
- `src/index.ts`: CORS, montaje de routers y arranque.
- `src/database/data-source.ts`: conexión MySQL y configuración de TypeORM.
