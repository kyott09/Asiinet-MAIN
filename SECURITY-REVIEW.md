# Revisión de seguridad: registro público

## Alcance

Revisión de `POST /api/users/register` y comprobaciones relacionadas de cambios de
rol en el perfil. No se revisó ni modificó el resto del backend en este documento.

## Hallazgo

- **Severidad:** Alta
- **Estado:** Corregido
- **Ubicación:** `back-asiinet/src/modules/user/user.controller.ts`
- **Descripción:** El registro público podía pasar el campo `role` suministrado por
  el cliente a la función de registro del servicio. Como resultado, un llamante
  sin autenticar podía intentar crear una cuenta con rol privilegiado, por
  ejemplo `admin`, `supervisor` u `operador`.
- **Impacto:** Una cuenta creada con un rol privilegiado podría acceder a
  capacidades reservadas a ese rol, según los permisos de la aplicación.

## Corrección

El controlador de registro público ahora extrae únicamente `email`, `password` y
`nombre` del cuerpo y llama al servicio con el rol fijo `cliente`. El servicio
conserva la capacidad de crear roles privilegiados para usos internos; los
caminos del sembrado de usuarios no pasan por este controlador. La actualización
de perfil mantiene una lista explícita de campos permitidos y no acepta `role`.

## Verificación

- `back-asiinet`: `npm test` pasó con 19/19 pruebas.
- `back-asiinet`: `npm run typecheck` conserva los mismos ocho errores preexistentes
  en `task.controller.ts` y `task.service.ts`; no se introdujeron errores nuevos.
- Prueba HTTP contra la instancia levantada desde el código corregido: el registro
  con `role: "admin"` respondió HTTP 201 con rol `cliente` y sin `passwordHash`.
  La cuenta temporal se eliminó al terminar la prueba.
- `front-asiinet/asiinet/src/pages/Register.jsx` sigue enviando `role: "user"`; el
  controlador ignora ese valor y asigna `cliente`.

## Comprobaciones relacionadas

`PUT /users/me` no permite cambiar el rol: el controlador solo pasa al servicio
`nombre`, `email`, `fechaNacimiento`, `domicilio` y `fotoPerfil`.
