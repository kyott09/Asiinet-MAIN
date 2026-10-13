# Servicios del frontend

## Propósito

Documenta el servicio de calendario que agrupa las solicitudes del navegador al API de eventos.

## Responsabilidades

`calendarService.js` define `API_BASE_URL` a partir de `VITE_API_URL` con una URL local alternativa y construye `EVENTS_URL` con `/api/events`. La función `request` centraliza `fetch`, incluye credenciales, agrega `Content-Type: application/json`, procesa respuesta JSON y transforma respuestas no exitosas en un `Error` con `statusCode` y `payload`.

## Cómo se conecta

`Calendar.jsx` usa `calendarService` para leer los eventos del mes y para crear, actualizar y eliminar eventos. Después de una mutación, vuelve a solicitar la lista mensual.

## Contratos

| Función | Solicitud | Resultado |
| --- | --- | --- |
| `getEvents(month)` | `GET /api/events?month=...` si recibe mes; sin query si no. | JSON de respuesta. |
| `createEvent(eventData)` | `POST /api/events`, cuerpo JSON. | JSON del evento creado. |
| `updateEvent(id, eventData)` | `PUT /api/events/:id`, cuerpo JSON. | JSON del evento actualizado. |
| `deleteEvent(id)` | `DELETE /api/events/:id`. | `null` cuando la respuesta es 204. |

Para otras respuestas, `request` intenta parsear JSON; si el cuerpo no es JSON usa `null`. En respuestas no exitosas, el mensaje proviene de `data.message` o de un texto genérico, y se adjuntan el status HTTP y el payload al error.

## Reglas de negocio

La sesión de navegador se envía con `credentials: "include"`. El servicio no aplica permisos ni validación de campos; esas reglas corresponden al servidor y al controlador de eventos.

## Errores y limitaciones conocidas

El servicio no maneja de forma especial el estado 401; lo propaga como error para que la vista lo muestre. La respuesta del servidor puede no incluir JSON, en cuyo caso el payload queda `null`. El valor configurado para producción de `VITE_API_URL` no se documenta aquí; **No verificado** fuera del código leído.

## Archivos fuente

- `front-asiinet/asiinet/src/services/calendarService.js`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `back-asiinet/src/modules/event/event.routes.ts`
- `back-asiinet/src/modules/event/event.controller.ts`
