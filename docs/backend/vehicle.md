# Módulo vehicle

## Propósito

Administra los vehículos de la flota vinculados a modelos del catálogo.

## Responsabilidades

La entidad `Vehicle` declara `id`, `patente` varchar única, `color` varchar, `descripcion` text nullable, `estado` varchar (disponible, en_uso, mantenimiento), `anio` integer nullable, relación `ManyToOne` con `VehicleModel` mediante `vehicle_model_id`, y `employee_id` entero nullable. `employee_id` se mantiene en la entidad para futuras asignaciones, pero **nunca se acepta por el cuerpo de solicitud ni se devuelve en las respuestas de la API**. El router se monta en `/api/vehicles` y está protegido con autenticación (`requireAuth`) y permisos (`requirePermission`).

| Método y ruta | Permiso | Respuesta |
| --- | --- | --- |
| `GET /api/vehicles` | `vehicles:read` | `200`, `{ vehicles: Vehicle[] }` (admite filtros opcionales `?brandId=` y `?modelId=`). |
| `GET /api/vehicles/:id` | `vehicles:read` | `200`, `{ vehicle: Vehicle }`. |
| `POST /api/vehicles` | `vehicles:write` | `201`, `{ vehicle: Vehicle }`. |
| `PUT /api/vehicles/:id` | `vehicles:write` | `200`, `{ vehicle: Vehicle }`. |
| `DELETE /api/vehicles/:id` | `vehicles:write` | `200`, `{ message: "Vehículo eliminado correctamente" }`. |

## Cómo se conecta

`vehicle.controller.ts` delega en `vehicle.service.ts`; el repositorio consulta `Vehicle` y carga `vehicleModel.brand` en lecturas. `vehicle.entity.ts` relaciona cada vehículo con su modelo. En eliminación, captura posibles errores de clave foránea de base de datos traduciéndolos a `409 Conflict`.

## Contratos

- **Filtros de consulta**: Los parámetros `?brandId=` y `?modelId=` en `GET /api/vehicles` se validan como enteros positivos (>= 1). Cualquier otro valor devuelve `400 Bad Request`.
- **Validación con Zod**:
  - `patente`: Valida con regex explícita `^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$` (formato tradicional argentino de 3 letras + 3 números, o formato Mercosur de 2 letras + 3 números + 2 letras), aplicando `trim` y `toUpperCase` antes de validar.
  - `anio`: Campo nullable. Si se provee, debe ser un entero entre `1980` y el `año actual + 1`.
  - `estado`: Debe ser estrictamente `"disponible"`, `"en_uso"` o `"mantenimiento"`.
  - `color`: Cadena obligatoria no vacía de hasta 50 caracteres.
  - `descripcion`: Cadena opcional nullable de hasta 500 caracteres.
  - `vehicleModelId`: Entero positivo correspondiente a un modelo existente.
  - `employee_id`: Se ignora/excluye en la validación de entrada y se elimina del payload retornado vía `formatVehicleResponse`.
- **Parámetros de ruta**: `id` se valida como entero positivo (>= 1); de lo contrario se responde `400 Bad Request`.
- **Existencia**: `getById`, `update` y `remove` comprueban existencia (`404 Not Found`).
- **Unicidad**: `create` y `update` comprueban duplicidad de patente (`409 Conflict`).

## Reglas de negocio

- Todas las respuestas de colección están envueltas en `{ vehicles }` y las individuales en `{ vehicle }`.
- `formatVehicleResponse` garantiza que `employee_id` nunca se exponga en la API pública.
- `DELETE` responde con código HTTP `200` y cuerpo `{ message }`.
- Permisos: `admin` y `supervisor` tienen `vehicles:read` y `vehicles:write`; `operador` solo tiene `vehicles:read`; `cliente` recibe `403 Forbidden`.
- Pruebas automáticas completas en `src/modules/vehicle/vehicle.test.ts`.
- Frontend integrado en `/vehiculos` con pestañas WAI-ARIA completas.

## Archivos fuente

- `back-asiinet/src/modules/vehicle/vehicle.entity.ts`
- `back-asiinet/src/modules/vehicle/vehicle.routes.ts`
- `back-asiinet/src/modules/vehicle/vehicle.controller.ts`
- `back-asiinet/src/modules/vehicle/vehicle.service.ts`
- `back-asiinet/src/modules/vehicle/vehicle.repository.ts`
- `back-asiinet/src/modules/vehicle/vehicle.validation.ts`
- `back-asiinet/src/modules/vehicle/vehicle.test.ts`
