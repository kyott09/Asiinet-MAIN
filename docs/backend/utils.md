# Utilidades del backend

## Propósito

Documenta `asyncHandler`, el adaptador común de controladores Express asíncronos.

## Responsabilidades

`asyncHandler` recibe un `RequestHandler` y devuelve otro `RequestHandler`. Ejecuta el handler y captura rechazos de su promesa para pasarlos al siguiente middleware de Express mediante `next(error)`.

## Cómo se conecta

Los controladores de los módulos importan `asyncHandler` y lo envuelven alrededor de handlers asíncronos. Así los errores lanzados por controladores o servicios llegan a la cadena común de errores descrita en [middlewares](middlewares.md) y [errores](errores.md).

## Contratos

La función normaliza el resultado a una promesa usando `Promise.resolve`; no cambia el valor de respuesta del controlador y no construye una respuesta HTTP por sí misma.

## Reglas de negocio

No define reglas de negocio; centraliza la propagación de rechazos de controladores.

## Errores y limitaciones conocidas

Los rechazos se entregan a `next`. El manejo de un error depende de los middlewares Express que continúan la cadena. No se detectó otra utilidad en este archivo. **No verificado** si todos los controladores asíncronos del proyecto están envueltos.

## Archivos fuente

- `back-asiinet/src/utils/asyncHandler.ts`
- `back-asiinet/src/middlewares/errors.ts`
