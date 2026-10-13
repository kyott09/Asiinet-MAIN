# Módulo task

## Propósito

Gestiona las solicitudes de servicio y tareas asignadas, con permisos por rol y comprobaciones de acceso al recurso.

## Responsabilidades

`task.routes.ts` define `GET /` (`tasks:read`), `POST /` (`tasks:create`), `PUT /:id` (`tasks:update` y acceso de recurso para actualizar) y `DELETE /:id` (`tasks:delete` y acceso de recurso para borrar). Todas requieren sesión.

`getAll`, `create`, `update` y `remove` en `task.controller.ts` validan/ejecutan la operación y responden respectivamente con `{ tasks }`, `{ task }`, `{ task }` y `{ message }` (altas con 201; las demás con 200). `parseTaskCreateInput` y `parseTaskUpdateInput` definen los campos aceptados según rol.

## Cómo se conecta

El middleware `requirePermission` consulta la matriz de `ROLE_PERMISSIONS`; `requireTaskAccess` carga la tarea y aplica `canAccessTask` en `middlewares/auth.ts`. `task.service.ts` filtra listas, valida asignaciones y serializa el resultado. Los campos persistidos y las relaciones están en [base de datos](../base-de-datos.md).

## Contratos

| Rol | Leer lista | Crear | Actualizar | Eliminar |
| --- | --- | --- | --- | --- |
| Admin | Todas | Sí | Sí, campos generales | Sí |
| Supervisor | Todas | Sí | Sí, campos generales | No |
| Operador | Tareas asignadas como operador en la lista | Sí | Tareas asignadas; fecha y estado | No |
| Cliente | Sus solicitudes | Sí | Propias; descripción | No |

El acceso de recurso para actualización permite admin y supervisor en cualquier tarea, operador únicamente si coincide `employeeId`, y cliente únicamente si coincide `clientId`. Para borrado, `canAccessTask` da acceso al admin, pero la ruta también exige `tasks:delete`, que solo tiene admin en la matriz actual. La lectura individual de `requireTaskAccess` permite operador si coincide `employeeId` o `clientId`, y cliente si coincide `clientId`; la lista de operador, en `getAll`, se filtra por `employeeId`.

Al crear, el cliente queda fijado a la identidad de sesión; la solicitud del cliente se crea sin empleado asignado, con prioridad `Baja` y estado `Vista`. Se rechaza otra solicitud activa del mismo servicio para ese cliente. Para otros roles, el servicio exige un empleado y valida que cliente y empleado tengan roles cliente y operador. La fecha de vencimiento no puede preceder la fecha de creación.

Los estados finales reconocidos al comprobar solicitudes activas son `terminada`, `finalizada` y `finalizado`. Las reglas de normalización de campos y valores opcionales están en `parseTaskCreateInput` y `parseTaskUpdateInput` de `task.controller.ts`. Para actualizar, el controlador usa `parseTaskUpdateInput` en cliente y operador; para admin y supervisor usa `parseTaskCreateInput`, que admite el conjunto general de campos.

## Reglas de negocio

- `getAll` en `task.service.ts` limita resultados por rol como se detalla en Contratos y serializa identificadores, nombres y campos de la tarea.
- `create` aplica valores predeterminados y asociación de cliente/operador según rol; `getAssignees` verifica ambos roles.
- `update` permite al cliente cambiar solo la descripción de su solicitud, al operador la fecha y estado de su tarea asignada, y a admin/supervisor los campos generales con validación de asignaciones.
- `requireTaskAccess` en `auth.ts` responde según la existencia e identidad de la tarea; la verificación de permiso de ruta se aplica además a la operación.

## Errores y limitaciones conocidas

La interfaz `Tareas.jsx` muestra el botón de eliminar a supervisores (`canDeleteTask` excluye clientes y empleados), mientras que el backend requiere `tasks:delete` y la matriz asigna ese permiso solo a admin. Es una diferencia observada entre visibilidad en interfaz y autorización de la API.

## Archivos fuente

- `back-asiinet/src/modules/task/task.routes.ts`
- `back-asiinet/src/modules/task/task.controller.ts`
- `back-asiinet/src/modules/task/task.service.ts`
- `back-asiinet/src/modules/task/task.repository.ts`
- `back-asiinet/src/middlewares/auth.ts`
- `back-asiinet/src/modules/task/task.controller.test.ts`
- `front-asiinet/asiinet/src/pages/Tareas.jsx`
