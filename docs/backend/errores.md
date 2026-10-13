# Errores del backend

## Propósito

Describe el formato común de error HTTP y el recorrido de errores por Express.

## Responsabilidades

`AppError` conserva `statusCode`, `code` y `message`. Sus constructores estáticos crean errores 400, 401, 403, 404, 409 y 500 con códigos predeterminados, permitiendo proporcionar un código alternativo cuando está contemplado.

## Cómo se conecta

Los servicios/controladores crean `AppError` para fallos conocidos. `asyncHandler` pasa rechazos a `next(error)`; middleware como `auth.ts` también llama `next(error)`. `notFoundHandler` hace lo mismo para rutas no encontradas. Finalmente `errorHandler` convierte el error en una respuesta HTTP.

## Contratos

El cuerpo JSON de error tiene forma `{ status, code, message }`. Para `AppError`, `status` es el texto `"error"`; el código HTTP se establece desde `err.statusCode` en la respuesta. `code` identifica la clase de error y `message` contiene el mensaje definido por el error.

Para errores que no son `AppError`, `errorHandler` registra el error en el servidor y responde HTTP 500 con `status: "error"`, `code: "INTERNAL_SERVER_ERROR"` y un mensaje genérico.

## Reglas de negocio

- `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict` e `internal` construyen respectivamente errores HTTP 400, 401, 403, 404, 409 y 500.
- `notFoundHandler` crea un error 404 que incorpora método y URL solicitados al mensaje.
- `errorHandler` distingue instancias `AppError` de errores inesperados; los segundos no exponen su detalle en el mensaje de respuesta.

## Errores y limitaciones conocidas

El formato del cuerpo está verificado en `errorHandler`. Los mensajes específicos de cada ruta dependen del módulo que origine el error. El comportamiento de errores generados después de que la respuesta HTTP ya haya comenzado queda **No verificado**.

## Archivos fuente

- `back-asiinet/src/middlewares/errors.ts`
- `back-asiinet/src/utils/asyncHandler.ts`
- `back-asiinet/src/index.ts`
