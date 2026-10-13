# Módulo vehicle

## Propósito

Administra vehículos vinculados a modelos del catálogo.

## Responsabilidades

La entidad `Vehicle` declara `id`, `patente` varchar única, `color` varchar, `descripcion` text nullable, `estado` varchar, relación `ManyToOne` con `VehicleModel` mediante `vehicle_model_id`, y `employee_id` entero nullable. `employee_id` es una columna simple, no una relación TypeORM. El router se monta en `/api/vehicles`.

| Método y ruta | Respuesta |
| --- | --- |
| `GET /api/vehicles` | `200`, vehículos incluyendo modelo y marca. |
| `GET /api/vehicles/:id` | `200`, vehículo incluyendo modelo y marca. |
| `POST /api/vehicles` | `201`, vehículo creado. |
| `PUT /api/vehicles/:id` | `200`, vehículo actualizado. |
| `DELETE /api/vehicles/:id` | `204`, sin cuerpo. |

El controlador toma `patente`, `color`, `descripcion`, `estado`, `vehicleModel` y `employee_id` del cuerpo en alta y edición.

## Cómo se conecta

`vehicle.controller.ts` delega en `vehicle.service.ts`; el repositorio consulta `Vehicle` y carga `vehicleModel.brand` en lecturas. `vehicle.entity.ts` relaciona cada vehículo con un modelo; la entidad del modelo declara su relación con una marca.

## Contratos

Los controladores convierten el parámetro `id` a número y rechazan el valor si `Number.isNaN` resulta verdadero. `getById`, `update` y `remove` verifican existencia del vehículo. `create` y `update` comprueban patente duplicada cuando el valor es truthy; la columna también está marcada como única.

No se detectó validación explícita de tipo, obligatoriedad, formato o normalización para los campos del vehículo, ni una validación del modelo asociado en `vehicle.service.ts`. `estado` es una cadena y el código revisado no establece un conjunto cerrado de estados. Restricciones concretas impuestas por la base de datos quedan **No verificado**.

## Reglas de negocio

- `getAll` y `getById` devuelven el vehículo con `vehicleModel` y `brand` cargados por el repositorio.
- `create` y `update` delegan la persistencia al repositorio y comprueban duplicidad de patente mediante `findByPatente`.
- El comentario de `vehicle.entity.ts` describe `employee_id` como campo escalar para una asignación futura; no hay relación TypeORM con empleado declarada.
- Permisos: pendiente de revisión de permisos.
- No se encontraron pruebas automáticas ni pantallas frontend para este módulo en el código revisado.

## Errores y limitaciones conocidas

Un identificador no numérico genera error de solicitud, un vehículo inexistente genera 404 y una patente duplicada detectada por el servicio genera conflicto. La respuesta para errores de restricción no detectados previamente queda **No verificado**.

## Archivos fuente

- `back-asiinet/src/modules/vehicle/vehicle.entity.ts`
- `back-asiinet/src/modules/vehicle/vehicle.routes.ts`
- `back-asiinet/src/modules/vehicle/vehicle.controller.ts`
- `back-asiinet/src/modules/vehicle/vehicle.service.ts`
- `back-asiinet/src/modules/vehicle/vehicle.repository.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.entity.ts`
- `back-asiinet/src/index.ts`
