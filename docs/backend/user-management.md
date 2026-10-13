# Módulo user-management

## Propósito

Administra el listado, alta, edición y baja de usuarios desde el backend.

## Responsabilidades

Las rutas `GET /`, `POST /`, `PUT /:id` y `DELETE /:id` de `user.routes.ts` requieren sesión y `users:write`. En la matriz actual, ese permiso corresponde al rol admin.

| Método y ruta | Respuesta del controlador |
| --- | --- |
| `GET /` | `200 { users }`, listado sin hash de contraseña. |
| `POST /` | `201 { user }`. |
| `PUT /:id` | `200 { user }`. |
| `DELETE /:id` | `200 { message }`. |

Los endpoints se montan en el router de usuarios. Los cuerpos de alta y edición aceptan campos permitidos explícitos; los campos desconocidos se rechazan.

## Cómo se conecta

`user-management.controller.ts` obtiene la identidad de sesión para edición y baja y delega en `user-management.service.ts`. `user-management.repository.ts` implementa las operaciones con TypeORM. El modelo de permisos se describe en [autenticación y permisos](../autenticacion-y-permisos.md); la relación de usuarios con tareas, en [base de datos](../base-de-datos.md).

## Contratos

- `create` acepta `nombre`, `email`, `password` y `role`; son obligatorios y el rol debe normalizarse a `admin`, `supervisor`, `operador` o `cliente`. `validatePassword` en `user-management.service.ts` valida la contraseña administrativa entre 8 y 72 bytes UTF-8.
- `update` acepta uno o más de `nombre`, `email` y `role`. El identificador debe ser entero seguro positivo.
- `list` devuelve `id`, `nombre`, `email`, `role` y `creadoEn`; la proyección no incluye el hash de contraseña.
- Alta, edición y baja detectan conflictos de email duplicado. Los errores se propagan por el manejador común.

## Reglas de negocio

- `create` en `createUserManagementService` valida campos y rol, comprueba email duplicado y cifra la contraseña antes de persistir.
- `update` en `createUserManagementService` ejecuta su operación dentro de `withAdminRowsLocked`: bloquea las filas de administradores y también la fila objetivo. Rechaza que una persona administradora se quite su propio rol y evita degradar al último admin.
- `update` cuenta las tareas asociadas antes de cambiar un rol. Un usuario con asignaciones como cliente no puede pasar a otro rol; uno con asignaciones como empleado no puede pasar a otro rol distinto de operador.
- `delete` en `createUserManagementService` rechaza la autoeliminación, bloquea filas dentro de una transacción, protege al último admin y rechaza borrar usuarios que tengan tareas asociadas como cliente o empleado.
- `withAdminRowsLocked` en `user-management.repository.ts` abre la transacción, adquiere bloqueos pesimistas para filas admin y para la fila consultada por identificador, y pasa esas operaciones al servicio.

## Errores y limitaciones conocidas

Los casos rechazados se expresan como errores de solicitud, no encontrado, prohibido o conflicto según el caso; el formato HTTP final lo determina el middleware común. La compatibilidad de la estrategia de bloqueo con motores o niveles de aislamiento distintos de la configuración del proyecto queda **No verificado**.

## Archivos fuente

- `back-asiinet/src/modules/user/user.routes.ts`
- `back-asiinet/src/modules/user/user-management.controller.ts`
- `back-asiinet/src/modules/user/user-management.service.ts`
- `back-asiinet/src/modules/user/user-management.repository.ts`
- `back-asiinet/src/modules/user/user-management.service.test.ts`
- `back-asiinet/src/middlewares/auth.ts`
