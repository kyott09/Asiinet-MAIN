# Módulo brand

## Propósito

Administra las marcas declaradas en el catálogo de vehículos.

## Responsabilidades

La entidad `Brand` declara `id` autogenerado y `descripcion` varchar única. El router se monta en `/api/brands` y está protegido con autenticación (`requireAuth`) y permisos (`requirePermission`).

| Método y ruta | Permiso | Respuesta |
| --- | --- | --- |
| `GET /api/brands` | `vehicles:read` | `200`, `{ brands: Brand[] }`. |
| `GET /api/brands/:id` | `vehicles:read` | `200`, `{ brand: Brand }`. |
| `POST /api/brands` | `vehicles:write` | `201`, `{ brand: Brand }`. |
| `PUT /api/brands/:id` | `vehicles:write` | `200`, `{ brand: Brand }`. |
| `DELETE /api/brands/:id` | `vehicles:write` | `200`, `{ message: "Marca eliminada correctamente" }`. |

## Cómo se conecta

`brand.controller.ts` delega en `brand.service.ts`; `brand.repository.ts` usa el repositorio TypeORM de `Brand`. `VehicleModel` tiene una relación `ManyToOne` con `Brand`. Antes de eliminar una marca, el servicio comprueba que no tenga modelos asociados consultando `vehicleModelRepository.findByBrandId`, y captura errores de clave foránea de base de datos traduciéndolos a `409 Conflict`.

## Contratos

- **Validación con Zod**: El cuerpo se valida mediante `parseBrandInput` (`descripcion` obligatoria, recortada, máximo 100 caracteres).
- **Parámetros**: Los identificadores de ruta (`id`) se validan como enteros positivos (>= 1); de lo contrario se responde `400 Bad Request`.
- **Existencia**: `getById`, `update` y `remove` comprueban que la marca exista (`404 Not Found`).
- **Unicidad**: `create` y `update` comprueban duplicidad de descripción (`409 Conflict`).
- **Borrado con dependencias**: Si la marca posee modelos asociados o la base arroja error de clave foránea, se responde `409 Conflict`.

## Reglas de negocio

- `getAll` devuelve las marcas envueltas en `{ brands }`.
- `create` y `update` construyen la entidad a partir de los campos estrictamente validados.
- `DELETE` responde con código HTTP `200` y cuerpo `{ message }`.
- Permisos: `admin` y `supervisor` tienen `vehicles:read` y `vehicles:write`; `operador` solo tiene `vehicles:read`; `cliente` recibe `403 Forbidden`.
- Cuenta con pruebas unitarias en `src/modules/vehicle/vehicle.test.ts` y soporte en frontend en `/vehiculos`.

## Archivos fuente

- `back-asiinet/src/modules/brand/brand.entity.ts`
- `back-asiinet/src/modules/brand/brand.routes.ts`
- `back-asiinet/src/modules/brand/brand.controller.ts`
- `back-asiinet/src/modules/brand/brand.service.ts`
- `back-asiinet/src/modules/brand/brand.repository.ts`
- `back-asiinet/src/modules/vehicle/vehicle.validation.ts`
