# Servicios del frontend

## Propósito

Documenta los servicios que agrupan las solicitudes del navegador a las APIs de tareas, eventos y vehículos.

## Responsabilidades

`calendarService.js` define `API_BASE_URL` a partir de `VITE_API_URL` con una URL local alternativa y construye `EVENTS_URL` con `/api/events`. La función `request` centraliza `fetch`, incluye credenciales, agrega `Content-Type: application/json`, procesa respuesta JSON y transforma respuestas no exitosas en un `Error` con `statusCode` y `payload`.

`vehicleService.js` usa la misma base configurable y centraliza las solicitudes de vehículos, modelos y marcas. Incluye credenciales, conserva el mensaje de error del API y, ante `401`, limpia `user` de `sessionStorage` y redirige a `/login`.

## Cómo se conecta

`Calendar.jsx` usa `calendarService` para leer los eventos del mes y para crear, actualizar y eliminar eventos. Después de una mutación, vuelve a solicitar la lista mensual.

`Vehiculos.jsx` usa `vehicleService` para cargar las tres colecciones, aplicar filtros de marca/modelo y ejecutar operaciones de escritura según el rol.

`Tareas/index.jsx` envía las solicitudes a `/api/tasks` con `credentials: "include"`. `shared/taskPayload.js` construye cuerpos con claves explícitas por rol; `shared/taskServiceDetails.js` comparte opciones y validación de interfaz de los detalles de servicio con el backend.

## Contratos

| Función | Solicitud | Resultado |
| --- | --- | --- |
| `getEvents(month)` | `GET /api/events?month=...` si recibe mes; sin query si no. | JSON de respuesta. |
| `createEvent(eventData)` | `POST /api/events`, cuerpo JSON. | JSON del evento creado. |
| `updateEvent(id, eventData)` | `PUT /api/events/:id`, cuerpo JSON. | JSON del evento actualizado. |
| `deleteEvent(id)` | `DELETE /api/events/:id`. | `null` cuando la respuesta es 204. |

`vehicleService` expone `getVehicles`, `getVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle`, `getBrands`, `createBrand`, `updateBrand`, `deleteBrand`, `getModels`, `createModel`, `updateModel` y `deleteModel`.

Los payloads de tarea se validan en el backend con schemas Zod estrictos. El frontend solo limita los campos de interfaz y no sustituye permisos ni validación del servidor.

Para otras respuestas, `request` intenta parsear JSON; si el cuerpo no es JSON usa `null`. En respuestas no exitosas, el mensaje proviene de `data.message` o de un texto genérico, y se adjuntan el status HTTP y el payload al error.

## Reglas de negocio

La sesión de navegador se envía con `credentials: "include"`. El servicio no aplica permisos ni validación de campos; esas reglas corresponden al servidor y al controlador de eventos.

## Errores y limitaciones conocidas

La respuesta del servidor puede no incluir JSON, en cuyo caso el payload queda `null`. El servicio de vehículos maneja `401` limpiando la sesión local y redirigiendo a login. La prueba visual de estos flujos queda pendiente de navegador.

## Archivos fuente

- `front-asiinet/asiinet/src/services/calendarService.js`
- `front-asiinet/asiinet/src/services/vehicleService.js`
- `front-asiinet/asiinet/src/pages/Tareas/index.jsx`
- `shared/taskPayload.js`
- `shared/taskServiceDetails.js`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `back-asiinet/src/modules/event/event.routes.ts`
- `back-asiinet/src/modules/event/event.controller.ts`
