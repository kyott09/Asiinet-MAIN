# Módulo brand

## Propósito

Administra las marcas declaradas en el catálogo de vehículos.

## Responsabilidades

La entidad `Brand` declara `id` autogenerado y `descripcion` varchar única. El router se monta en `/api/brands`.

| Método y ruta | Respuesta |
| --- | --- |
| `GET /api/brands` | `200`, arreglo de marcas. |
| `GET /api/brands/:id` | `200`, una marca. |
| `POST /api/brands` | `201`, marca creada; toma `descripcion` del cuerpo. |
| `PUT /api/brands/:id` | `200`, marca actualizada; toma `descripcion` del cuerpo. |
| `DELETE /api/brands/:id` | `204`, sin cuerpo. |

## Cómo se conecta

`brand.controller.ts` delega en `brand.service.ts`; `brand.repository.ts` usa el repositorio TypeORM de `Brand`. `VehicleModel` tiene una relación `ManyToOne` con `Brand`, documentada en la entidad correspondiente.

## Contratos

`getById`, `update` y `remove` comprueban que la marca exista. Los controladores convierten el parámetro `id` a número y rechazan el valor si `Number.isNaN` resulta verdadero. `create` y `update` consultan si ya existe otra marca con la misma descripción cuando el valor recibido es truthy y responden conflicto si la encuentran; la columna también está marcada como única en TypeORM.

No se detectó validación explícita de tipo, obligatoriedad, longitud o normalización de `descripcion` en el controlador o servicio. El efecto de una descripción ausente o de un conflicto originado directamente por la restricción de base de datos queda **No verificado**.

## Reglas de negocio

- `getAll` devuelve el resultado del repositorio sin transformación.
- `getById`, `create`, `update` y `remove` están implementadas en `brand.service.ts` y utilizan el repositorio para consultar o persistir.
- Permisos: pendiente de revisión de permisos.
- No se encontraron pruebas automáticas ni pantallas frontend para este módulo en el código revisado.

## Errores y limitaciones conocidas

Un identificador no numérico genera error de solicitud; una marca inexistente genera 404 y una descripción duplicada detectada por el servicio genera conflicto. El comportamiento HTTP para errores de restricción no detectados previamente queda **No verificado**.

## Archivos fuente

- `back-asiinet/src/modules/brand/brand.entity.ts`
- `back-asiinet/src/modules/brand/brand.routes.ts`
- `back-asiinet/src/modules/brand/brand.controller.ts`
- `back-asiinet/src/modules/brand/brand.service.ts`
- `back-asiinet/src/modules/brand/brand.repository.ts`
- `back-asiinet/src/index.ts`
