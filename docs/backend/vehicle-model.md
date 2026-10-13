# Módulo vehicle-model

## Propósito

Administra modelos de vehículo asociados a una marca.

## Responsabilidades

`VehicleModel` declara `id`, `descripcion` varchar y una relación `ManyToOne` requerida en el código con `Brand`, mediante la columna `brand_id`. El router se monta en `/api/vehicle-models`.

| Método y ruta | Respuesta |
| --- | --- |
| `GET /api/vehicle-models` | `200`, modelos incluyendo relación `brand`. |
| `GET /api/vehicle-models/by-brand/:brandId` | `200`, modelos de la marca indicada, incluyendo `brand`. |
| `GET /api/vehicle-models/:id` | `200`, un modelo incluyendo `brand`. |
| `POST /api/vehicle-models` | `201`, modelo creado; cuerpo con `descripcion` y `brandId`. |
| `PUT /api/vehicle-models/:id` | `200`, modelo actualizado; cuerpo puede incluir `descripcion` y `brandId`. |
| `DELETE /api/vehicle-models/:id` | `204`, sin cuerpo. |

## Cómo se conecta

`vehicle-model.controller.ts` delega en `vehicle-model.service.ts`; el repositorio carga `brand` en consultas de lectura. El servicio busca la marca mediante `brand.repository.ts` al filtrar, crear o cambiar la marca asociada. `Vehicle` tiene relación `ManyToOne` con `VehicleModel`.

## Contratos

Los controladores convierten `id` y `brandId` a número y rechazan valores para los que `Number.isNaN` sea verdadero. `getById` y `remove` verifican existencia del modelo; `getByBrand` verifica primero que exista la marca. `create` requiere una marca existente y devuelve error de solicitud con código `INVALID_BRAND` si no existe. `update` verifica la existencia del modelo y, si recibe `brandId`, valida que la marca exista antes de asignarla.

No se detectó validación explícita de tipo, obligatoriedad, longitud o normalización para `descripcion`; tampoco una regla de unicidad de esa columna. Restricciones que pueda aplicar la base de datos quedan **No verificado**.

## Reglas de negocio

- `getAll`, `getById` y `getByBrand` devuelven modelos con relación `brand` cargada por el repositorio.
- `create` asocia la entidad de marca encontrada a `VehicleModel.brand`.
- `update` solo cambia `descripcion` o `brand` cuando el campo correspondiente está presente.
- Permisos: pendiente de revisión de permisos.
- No se encontraron pruebas automáticas ni pantallas frontend para este módulo en el código revisado.

## Errores y limitaciones conocidas

Los identificadores no numéricos generan error de solicitud, un modelo o marca inexistente genera 404 según la operación y una marca indicada que no existe en creación/edición genera `INVALID_BRAND`. El resultado al eliminar un modelo relacionado con vehículos queda **No verificado**.

## Archivos fuente

- `back-asiinet/src/modules/vehicle-model/vehicle-model.entity.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.routes.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.controller.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.service.ts`
- `back-asiinet/src/modules/vehicle-model/vehicle-model.repository.ts`
- `back-asiinet/src/modules/brand/brand.repository.ts`
- `back-asiinet/src/modules/vehicle/vehicle.entity.ts`
- `back-asiinet/src/index.ts`
