# Módulo vehicle-model

## Propósito

Administra los modelos de vehículos vinculados a una marca.

## Responsabilidades

La entidad `VehicleModel` declara `id`, `descripcion` varchar y relación `ManyToOne` con `Brand` (`brand_id`). El router se monta en `/api/vehicle-models` y está protegido con autenticación (`requireAuth`) y permisos (`requirePermission`).

| Método y ruta | Permiso | Respuesta |
| --- | --- | --- |
| `GET /api/vehicle-models` | `vehicles:read` | `200`, `{ vehicleModels: VehicleModel[] }`. |
| `GET /api/vehicle-models/by-brand/:brandId` | `vehicles:read` | `200`, `{ vehicleModels: VehicleModel[] }`. |
| `GET /api/vehicle-models/:id` | `vehicles:read` | `200`, `{ vehicleModel: VehicleModel }`. |
| `POST /api/vehicle-models` | `vehicles:write` | `201`, `{ vehicleModel: VehicleModel }`. |
| `PUT /api/vehicle-models/:id` | `vehicles:write` | `200`, `{ vehicleModel: VehicleModel }`. |
| `DELETE /api/vehicle-models/:id` | `vehicles:write` | `200`, `{ message: "Modelo de vehículo eliminado correctamente" }`. |

## Cómo se conecta

`vehicle-model.controller.ts` delega en `vehicle-model.service.ts`; el repositorio carga la relación `brand` en consultas. Antes de eliminar un modelo, el servicio comprueba que no tenga vehículos asociados consultando `vehicleRepository.findByModelId`, y captura errores de clave foránea de base de datos traduciéndolos a `409 Conflict`.

## Contratos

- **Validación con Zod**: El cuerpo se valida con `parseVehicleModelInput` al crear y `parseVehicleModelUpdateInput` al actualizar (`descripcion` requerida de hasta 100 caracteres y `brandId` entero positivo).
- **Parámetros**: `id` y `brandId` se validan como enteros positivos (>= 1); de lo contrario se responde `400 Bad Request`.
- **Existencia**: `getById`, `update` y `remove` comprueban que el modelo exista (`404 Not Found`). La marca indicada debe existir (`400 Bad Request`).
- **Borrado con dependencias**: Si el modelo posee vehículos asociados o la base arroja error de clave foránea, se responde `409 Conflict`.

## Reglas de negocio

- `getAll` y `getByBrand` devuelven los modelos con su marca cargada envueltos en `{ vehicleModels }`.
- `create` y `update` construyen la entidad a partir de los campos validados.
- `DELETE` responde con código HTTP `200` y cuerpo `{ message }`.
- Permisos: `admin` y `supervisor` tienen `vehicles:read` y `vehicles:write`; `operador` solo tiene `vehicles:read`; `cliente` recibe `403 Forbidden`.
- Cuenta con pruebas unitarias en `src/modules/vehicle/vehicle.test.ts` y soporte en frontend en `/vehiculos`.

## Archivos fuente

- `back-asiinet/src/modules/vehicle-model/vehicle-model.entity.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.routes.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.controller.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.service.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.repository.ts`
- `back-asiinet/src/modules/vehicle/vehicle.validation.ts`
