# Páginas del frontend

## Propósito

Resume el contenido, acceso, llamadas de red y estados visibles de cada página montada por `AppRoutes`.

## Responsabilidades

| Página y ruta | Acceso de ruta | Qué muestra | Endpoints que llama | Estados visibles principales |
| --- | --- | --- | --- | --- |
| Login (`/`, `/login`) | Pública | Formulario de email y contraseña. | `POST /api/users/login` | Envío, error y transición al salir hacia inicio. |
| Register (`/register`) | Pública | Formulario de nombre, email, contraseña y confirmación. | `POST /api/users/register` | Envío, error por validación/error de servidor; éxito navega a login. |
| Home (`/home`) | Cualquier sesión local | Presentación de operaciones, tipos de servicio y accesos a tareas; acción cambia según rol. | Ninguno | Contenido estático; el texto de acción se adapta a cliente/no cliente. |
| Profile (`/profile`) | Cualquier sesión local | Datos personales y formulario de nombre, email, fecha, domicilio y foto. | `GET /api/users/me`, `PUT /api/users/me` | Carga inicial, guardado, éxito/error; 401 limpia sesión local y redirige a login. |
| Users (`/users`) | Solo admin según `ProtectedRoute` | Tabla/lista adaptable de cuentas, roles y acciones de alta, edición y baja. | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` | Carga, error con reintento, lista vacía, aviso de éxito, diálogo y error de formulario. |
| Gallery (`/galeria`) | Cualquier sesión local | Carrusel con tres imágenes incluidas como assets locales. | Ninguno | Estado y navegación del carrusel; tratamiento de carga/error de red: no aplica a los datos mostrados. |
| Tareas (`/tareas`) | Cualquier sesión local | Solicitudes o tareas, búsqueda/filtro y formularios según rol. | `GET /api/tasks`; `GET /api/users/assignables` para admin y supervisor; `POST`, `PUT` y `DELETE /api/tasks/:id` según acción. | Carga, vacío, error, aviso de éxito, guardado/borrado, confirmación de eliminación y filtros. Un 401 elimina `user` de `sessionStorage` y navega a login. |
| Calendar (`/calendario`) | Admin, supervisor u operador según `allowedRoles` | Calendario mensual, leyenda, eventos y diálogo para ver/crear/editar/eliminar. | `GET /api/events?month=YYYY-MM`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id` | Carga, error con reintento, calendario sin/eventos, diálogo, error de operación y aviso de éxito. |
| Vehículos (`/vehiculos`) | Admin, supervisor u operador según `allowedRoles` | Pestañas de vehículos, modelos y marcas; operadores tienen lectura y admin/supervisor escritura. | `GET`, `POST`, `PUT`, `DELETE` de `/api/vehicles`, `/api/vehicle-models` y `/api/brands` | Carga, error, listas vacías, filtros de marca/modelo, formularios, confirmación y avisos. |
| NotFound (`*`) | Pública; ruta comodín | Mensaje 404, logo y enlace a login. | Ninguno | Vista 404 estática. |

En Tareas, la solicitud de asignables se omite para cliente y operador; la página solo la envía para admin y supervisor. El backend fija el cliente a la sesión. Los permisos y el alcance por recurso del backend se documentan en [task](../backend/task.md). Las páginas del panel también incluyen `AccountActions`, que llama `POST /api/users/logout` al cerrar sesión.

## Cómo se conecta

`AppRoutes.jsx` monta las rutas y aplica restricciones locales. `DashboardSidebar` y `AccountActions` aparecen en las páginas del panel. Los endpoints son los que usan las llamadas `fetch` de cada página o servicio; la base del API proviene de `VITE_API_URL` con un valor alternativo definido en código.

## Contratos

- **Tareas y permiso de eliminar:** `Tareas.jsx` calcula `canDeleteTask` excluyendo clientes y empleados, por lo que el botón de eliminar también se muestra a supervisores. El backend protege `DELETE /api/tasks/:id` con `tasks:delete`, permiso que en la matriz actual corresponde a admin. Esta es una discrepancia observada entre la presentación de la acción y la autorización del endpoint.
- **Calendar:** la ruta limita roles en el cliente; además, las operaciones de eventos requieren permisos del backend y las mutaciones tienen regla de creador. La interfaz distingue errores de carga y mensajes de operación.
- **Users:** los formularios usan los endpoints administrativos de usuarios; el backend es quien aplica `users:write` y sus validaciones.
- Los datos de Home son locales al componente y los de Gallery apuntan a archivos empaquetados; estas páginas no solicitan esos contenidos al API.

## Reglas de negocio

La columna de acceso describe exclusivamente la regla declarada en la ruta frontend, no una concesión de permisos del servidor. Las páginas protegidas por `ProtectedRoute` dependen de `sessionStorage`; la autorización real está en el backend, según [rutas y sesión](rutas-y-sesion.md) y [autenticación y permisos](../autenticacion-y-permisos.md).

## Errores y limitaciones conocidas

Las listas y formularios muestran estados explícitos, pero el tratamiento de 401 no es común a todas las páginas: Profile y Tareas limpian la sesión local; Users y Calendar muestran errores de solicitud sin limpieza específica observada. La prueba manual del menú móvil, teclado y responsive está pendiente.

## Archivos fuente

- `front-asiinet/asiinet/src/routes/AppRoutes.jsx`
- `front-asiinet/asiinet/src/pages/Login.jsx`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `front-asiinet/asiinet/src/pages/Home.jsx`
- `front-asiinet/asiinet/src/pages/Profile.jsx`
- `front-asiinet/asiinet/src/pages/Users.jsx`
- `front-asiinet/asiinet/src/pages/Gallery.jsx`
- `front-asiinet/asiinet/src/pages/Tareas.jsx`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `front-asiinet/asiinet/src/pages/NotFound.jsx`
- `front-asiinet/asiinet/src/services/calendarService.js`
- `back-asiinet/src/middlewares/auth.ts`
- `back-asiinet/src/modules/task/task.routes.ts`
- `front-asiinet/asiinet/src/pages/Vehiculos/Vehiculos.jsx`
- `front-asiinet/asiinet/src/services/vehicleService.js`
