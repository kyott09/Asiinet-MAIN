# Páginas del frontend

## Propósito

Resume el contenido, acceso, llamadas de red y estados visibles de cada página montada por `AppRoutes`.

## Responsabilidades

| Página y ruta | Acceso de ruta | Qué muestra | Endpoints que llama | Estados visibles principales |
| --- | --- | --- | --- | --- |
| Home (`/`) | Pública | Presentación institucional, red de conectividad, tipos de servicio y galería local; saludo y acción principal cambian según la sesión y el rol. | Ninguno | Contenido estático; invitación a iniciar sesión para visitantes, enlace al panel para roles internos y a solicitudes para clientes. |
| Login (`/login`) | Pública | Formulario de email y contraseña. | `POST /api/users/login` | Envío, error y transición al salir hacia el panel. |
| Register (`/register`) | Pública | Formulario de nombre, email, contraseña y confirmación. | `POST /api/users/register` | Envío, error por validación/error de servidor; éxito navega a login. |
| Panel (`/panel`) | Cualquier sesión local | Panel interno con navegación operativa, acceso a tareas y galería integrada para clientes. | Ninguno | Contenido estático; el texto de acción y la galería se adaptan al rol. |
| Profile (`/profile`) | Cualquier sesión local | Datos personales y formulario de nombre, email, fecha, domicilio y foto. | `GET /api/users/me`, `PUT /api/users/me` | Carga inicial, guardado, éxito/error; 401 limpia sesión local y redirige a login. |
| Users (`/users`) | Solo admin según `ProtectedRoute` | Tabla/lista adaptable de cuentas, roles y acciones de alta, edición y baja. | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` | Carga, error con reintento, lista vacía, aviso de éxito, diálogo y error de formulario. |
| Compatibilidad (`/home`) | Redirección | Redirige a `/panel`. | Ninguno | Mantiene enlaces antiguos al panel interno. |
| Gallery (`/galeria`) | Redirección | Redirige a `/`; la galería es parte de Home pública. | Ninguno | El carrusel usa navegación local. |
| Tareas (`/tareas`) | Cualquier sesión local | Solicitudes o tareas, búsqueda/filtro y formularios según rol; `dueDate` es opcional para admin/supervisor al crear/editar y operador al actualizar, y se muestra `Sin fecha`; cliente elige visita opcional al crear; admin/supervisor gestionan fecha y franja en cualquier estado; todas las vistas muestran la visita programada o `A coordinar`. El listado pagina en servidor y conserva página, tamaño y filtros en la URL. | `GET /api/tasks?page=&pageSize=&q=&status=`; `GET /api/users/assignables` para admin y supervisor; `POST`, `PUT` y `DELETE` `/api/tasks/:id` según acción. | Carga, vacío, error, aviso de éxito, guardado/borrado, confirmación de eliminación, filtros y rango/paginación accesibles. Un 401 elimina `user` de `sessionStorage` y navega a login. |
| Calendar (`/calendario`) | Admin, supervisor u operador según `allowedRoles` | Calendario mensual, leyenda, eventos y diálogo para ver/crear/editar/eliminar. | `GET /api/events?month=YYYY-MM`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id` | Carga, error con reintento, calendario sin/eventos, diálogo, error de operación y aviso de éxito. |
| Vehículos (`/vehiculos`) | Admin, supervisor u operador según `allowedRoles` | Pestañas de vehículos, modelos y marcas; operadores tienen lectura y admin/supervisor escritura. | `GET`, `POST`, `PUT`, `DELETE` de `/api/vehicles`, `/api/vehicle-models` y `/api/brands` | Carga, error, listas vacías, filtros de marca/modelo, formularios, confirmación y avisos. |
| NotFound (`*`) | Pública; ruta comodín | Mensaje 404, logo y enlace a login. | Ninguno | Vista 404 estática. |

En Tareas, la solicitud de asignables se omite para cliente y operador; la página solo la envía para admin y supervisor. El backend fija el cliente a la sesión. Cliente solo puede elegir visita al crear y no puede editarla después; operador no puede escribir visitas ni detalles. Admin/supervisor pueden gestionarlos al crear y editar, sin bloqueo por estado. Las fechas de visita se presentan desde `YYYY-MM-DD` para evitar cambios de día por zona local. Los permisos y el alcance por recurso del backend se documentan en [task](../backend/task.md). Las páginas del panel también incluyen `AccountActions`, que llama `POST /api/users/logout` al cerrar sesión.

Para Tareas, el tamaño inicial es 20 con opciones 10, 20 y 30. La API devuelve `meta` al paginar y conserva la respuesta histórica cuando no se envían `page` ni `pageSize`. El estado de la vista está en la query URL para compartirla y restaurarla con Atrás/Adelante; los filtros reinician la página a 1. Un borrado que deja vacía la última página lleva a la última página disponible.

## Cómo se conecta

`AppRoutes.jsx` monta las rutas y aplica restricciones locales. `DashboardSidebar` y `AccountActions` aparecen en las páginas del panel. Los endpoints son los que usan las llamadas `fetch` de cada página o servicio; la base del API proviene de `VITE_API_URL` con un valor alternativo definido en código.

## Contratos

- **Tareas y permiso de eliminar:** `Tareas.jsx` calcula `canDeleteTask` excluyendo clientes y empleados, por lo que el botón de eliminar también se muestra a supervisores. El backend protege `DELETE /api/tasks/:id` con `tasks:delete`, permiso que en la matriz actual corresponde a admin. Esta es una discrepancia observada entre la presentación de la acción y la autorización del endpoint.
- **Calendar:** la ruta limita roles en el cliente; además, las operaciones de eventos requieren permisos del backend y las mutaciones tienen regla de creador. La interfaz distingue errores de carga y mensajes de operación.
- **Users:** los formularios usan los endpoints administrativos de usuarios; el backend es quien aplica `users:write` y sus validaciones.
- Los datos de Home y las fotos de la galería son locales y apuntan a archivos empaquetados; no solicitan esos contenidos al API.

## Reglas de negocio

La columna de acceso describe exclusivamente la regla declarada en la ruta frontend, no una concesión de permisos del servidor. Las páginas protegidas por `ProtectedRoute` dependen de `sessionStorage`; la autorización real está en el backend, según [rutas y sesión](rutas-y-sesion.md) y [autenticación y permisos](../autenticacion-y-permisos.md).

## Errores y limitaciones conocidas

Las listas y formularios muestran estados explícitos, pero el tratamiento de 401 no es común a todas las páginas: Profile y Tareas limpian la sesión local; Users y Calendar muestran errores de solicitud sin limpieza específica observada. La prueba manual del menú móvil, teclado y responsive está pendiente.

## Archivos fuente

- `front-asiinet/asiinet/src/routes/AppRoutes.jsx`
- `front-asiinet/asiinet/src/pages/Login.jsx`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `front-asiinet/asiinet/src/pages/Home/Home.jsx`
- `front-asiinet/asiinet/src/pages/Profile.jsx`
- `front-asiinet/asiinet/src/pages/Users.jsx`
- `front-asiinet/asiinet/src/pages/Panel.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryCarousel.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/index.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/taskPagination.js`
- `front-asiinet/asiinet/src/pages/Tareas/taskPagination.test.js`
- `front-asiinet/asiinet/src/components/pagination/Pagination.jsx`
- `front-asiinet/asiinet/src/components/pagination/Pagination.css`
- `front-asiinet/asiinet/src/components/pagination/paginationUtils.js`
- `front-asiinet/asiinet/src/pages/Tareas/components/TaskForm.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/components/TaskTable.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/components/TaskCards.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/components/ServiceDetailsFields.jsx`
- `front-asiinet/asiinet/src/pages/Tareas/components/TaskServiceDetailsDisplay.jsx`
- `shared/taskPayload.js`
- `shared/taskServiceDetails.js`
- `shared/taskVisitSlots.js`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `front-asiinet/asiinet/src/pages/NotFound.jsx`
- `front-asiinet/asiinet/src/services/calendarService.js`
- `back-asiinet/src/middlewares/auth.ts`
- `back-asiinet/src/modules/task/task.routes.ts`
- `front-asiinet/asiinet/src/pages/Vehiculos/Vehiculos.jsx`
- `front-asiinet/asiinet/src/services/vehicleService.js`
