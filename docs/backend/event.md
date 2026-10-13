# Módulo event

## Propósito

Gestiona los eventos del calendario con edición y eliminación restringidas a su creador.

## Responsabilidades

Las rutas de `event.routes.ts` requieren sesión. `GET /` requiere `calendar:read`; `POST /`, `PUT /:id` y `DELETE /:id` requieren `calendar:write`.

| Método y ruta | Contrato observado |
| --- | --- |
| `GET /?month=YYYY-MM` | Devuelve una lista; el filtro mensual es opcional. |
| `POST /` | Recibe `titulo`, `tipo`, `fecha` y `descripcion` opcional; responde 201 con el evento. |
| `PUT /:id` | Recibe uno o más campos editables; responde 200 con el evento. |
| `DELETE /:id` | Responde 204 al eliminar. |

## Cómo se conecta

`event.controller.ts` valida parámetros y cuerpos y delega en `event.service.ts`; `event.repository.ts` persiste la entidad. La relación requerida del creador y su acción de borrado se describen en [base de datos](../base-de-datos.md).

## Contratos

Los tipos válidos son una lista fija declarada en `EVENT_TYPES`: `reunion`, `cumpleanos`, `capacitacion`, `licencia` y `otro`. `titulo` se recorta y debe tener entre 1 y 120 caracteres; `fecha` debe tener formato ISO de fecha y ser una fecha real; `descripcion` puede ser nula u omitirse y admite hasta 500 caracteres. Los esquemas rechazan campos adicionales. El parámetro mensual, si se envía, debe tener formato `YYYY-MM`.

`createEvent` pasa el usuario autenticado al servicio. `create` en `event.service.ts` guarda `creadorId` desde `actor.id`, sin tomar el creador del cuerpo. `update` y `remove` comparan el creador almacenado con el usuario de sesión y responden 403 para cualquier otro usuario, incluido admin.

## Reglas de negocio

- `getAll` filtra por prefijo de mes cuando se solicita y calcula `esPropio` comparando creador con sesión.
- Solo el creador puede actualizar o eliminar un evento. La regla se aplica en `update` y `remove` de `event.service.ts`.
- La relación `Event.creador` en `event.entity.ts` es obligatoria y declara `onDelete: CASCADE`; la eliminación del usuario creador elimina en cascada sus eventos según el esquema declarado.
- `event.controller.test.ts` contiene pruebas automáticas para permisos, validación y propiedad del evento. La prueba manual con usuarios reales está pendiente.

## Errores y limitaciones conocidas

Los identificadores inválidos, mes inválido y cuerpos que no cumplen el esquema generan error de solicitud; evento inexistente genera 404; operación de otro usuario genera 403. La ejecución de las pruebas no se realizó durante este bloque; la cobertura se verificó leyendo el archivo de pruebas. La prueba manual con usuarios reales está pendiente.

## Archivos fuente

- `back-asiinet/src/modules/event/event.routes.ts`
- `back-asiinet/src/modules/event/event.controller.ts`
- `back-asiinet/src/modules/event/event.service.ts`
- `back-asiinet/src/modules/event/event.repository.ts`
- `back-asiinet/src/modules/event/event.entity.ts`
- `back-asiinet/src/modules/event/event.types.ts`
- `back-asiinet/src/modules/event/event.controller.test.ts`
- `back-asiinet/src/middlewares/auth.ts`
