# Middlewares del backend

## Propósito

Resume autenticación y permisos de recursos en `auth.ts`, junto con la delegación de errores HTTP en `errors.ts`.

## Responsabilidades

- `requireAuth` valida la sesión y agrega la identidad actual a `req.user`.
- `requirePermission` comprueba uno o más permisos de la matriz `ROLE_PERMISSIONS`.
- `requireTaskAccess` carga una tarea y comprueba si el actor puede realizar la acción indicada.
- `notFoundHandler` convierte una ruta no atendida en un `AppError` 404.
- `errorHandler` genera la respuesta HTTP de error.

## Cómo se conecta

`requireAuth` extrae el token de la cookie de sesión, lo verifica mediante JWT y luego consulta al repositorio de usuarios (`userRepository.findById`) para confirmar que el usuario siga existiendo y obtener su rol actual. Si la identidad no existe, propaga 401. La función `createRequireAuth` permite inyectar la consulta y la clave para facilitar configuración/pruebas.

`requirePermission` usa `hasPermission`, que normaliza alias de rol mediante `normalizeRole`. `requireTaskAccess` usa `findTaskById` del repositorio de tareas y `canAccessTask`. La matriz `ROLE_PERMISSIONS` define los permisos generales por rol; admin pasa cualquier permiso en `hasPermission`, y los demás roles se comparan con las listas declaradas.

## Contratos

`ROLE_PERMISSIONS` declara permisos para admin, supervisor, operador y cliente. `requireRole` realiza una comprobación de rol separada. `requirePermission` y `requireTaskAccess` llaman a `next(AppError...)` ante falta de autenticación, formato de ID incorrecto, recurso inexistente o autorización denegada.

`canAccessTask` distingue lectura, actualización y eliminación según actor y `clientId`/`employeeId` de la tarea. Admin tiene acceso; supervisor puede leer/actualizar pero no eliminar; operador puede leer si coincide como cliente o empleado y modificar si es el empleado; cliente puede leer/modificar su tarea. Las rutas agregan además permisos generales según la operación.

## Reglas de negocio

- `requireAuth` verifica token y vuelve a leer la cuenta desde la base de datos; el rol de `req.user` proviene de esa consulta y se normaliza.
- `requirePermission` responde con error de autenticación cuando no hay `req.user` y con prohibido si falta alguno de los permisos requeridos.
- `requireTaskAccess` valida ID entero seguro positivo, busca la tarea, delega la decisión en `canAccessTask` y adjunta la tarea a `req.task` cuando permite continuar.
- `notFoundHandler` entrega `AppError.notFound` a la cadena Express.
- `errorHandler` serializa `AppError`; para otros errores registra el error en servidor y emite un error genérico 500.

## Errores y limitaciones conocidas

Los errores esperados se responden con HTTP `statusCode` y cuerpo `{ status: "error", code, message }`. Para errores inesperados el cuerpo contiene `status: "error"`, `code: "INTERNAL_SERVER_ERROR"` y un mensaje genérico. `index.ts` monta primero las rutas, luego `notFoundHandler` y por último `errorHandler`.

## Archivos fuente

- `back-asiinet/src/middlewares/auth.ts`
- `back-asiinet/src/middlewares/errors.ts`
- `back-asiinet/src/modules/user/user.repository.ts`
- `back-asiinet/src/modules/task/task.repository.ts`
- `back-asiinet/src/index.ts`
- `back-asiinet/src/middlewares/auth.test.ts`
