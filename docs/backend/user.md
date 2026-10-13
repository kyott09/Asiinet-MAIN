# Módulo user

## Propósito

Gestiona el registro público, el inicio y cierre de sesión, el perfil propio y los usuarios disponibles para asignaciones.

## Responsabilidades

- `createRegisterHandler` en `user.controller.ts` toma `email`, `password` y `nombre` del cuerpo y llama a `userService.register` forzando el rol `cliente`. El rol del registro público siempre es cliente.
- `register` responde 201 con el usuario público. `login` valida credenciales mediante `userService.login`, establece la cookie de sesión y responde 201. `logout` limpia la cookie y responde 200.
- `getCurrentUser` devuelve el perfil de la sesión en `{ user }`. `updateProfile` permite enviar `nombre`, `email`, `fechaNacimiento`, `domicilio` y `fotoPerfil` para el usuario autenticado.
- `getAssignableUsers` devuelve `{ clients, employees }`; `getAssignableUsers` en el servicio limita `clients` a rol cliente y `employees` a roles operador o empleado, con `id`, `nombre` y `email`.

## Cómo se conecta

Las rutas públicas de registro, login y logout se declaran en `user.routes.ts`. `/me` y `/assignables` requieren autenticación; `/assignables` además requiere `users:read`. El módulo de gestión usa las mismas rutas del router y se documenta en [user-management](user-management.md). La sesión y permisos generales se describen en [autenticación y permisos](../autenticacion-y-permisos.md).

## Contratos

| Método y ruta | Acceso | Respuesta observada |
| --- | --- | --- |
| `POST /register` | Pública | `201`, usuario público; siempre con rol cliente. |
| `POST /login` | Pública | `201`, resultado del servicio; establece cookie de sesión. |
| `POST /logout` | Pública | `200`, mensaje de cierre; limpia cookie de sesión. |
| `GET /me` | Sesión requerida | `200`, `{ user }`. |
| `PUT /me` | Sesión requerida | `200`, `{ message, user }`; recibe los campos de perfil indicados arriba. |
| `GET /assignables` | Sesión y `users:read` | `200`, `{ clients, employees }`. |

El formulario público de registro exige contraseña de 6 caracteres y el servidor no valida longitud.

## Reglas de negocio

- `register` en `user.service.ts` busca email duplicado, cifra la contraseña y construye el usuario público sin exponer el hash. Aunque el servicio contiene normalización de roles, el controlador público siempre le pasa `cliente`.
- `login` en `user.service.ts` compara la contraseña con el hash almacenado y emite la identidad autenticada; las credenciales inválidas generan error.
- `updateProfile` en `user.service.ts` comprueba conflicto de email y normaliza los campos de fecha que procesa. Los campos aceptados por el controlador son los enumerados en Responsabilidades.
- `getAssignableUsers` en `user.service.ts` no es un listado general: devuelve clientes y operadores/empleados para selección de asignaciones.

## Errores y limitaciones conocidas

El código del servidor no valida longitud de contraseña en el registro público. En esta documentación se registra únicamente el requisito de 6 caracteres del formulario y la ausencia de esa validación en servidor. Los detalles de las respuestas de error por validación de perfil quedan **No verificado**.

## Archivos fuente

- `back-asiinet/src/modules/user/user.routes.ts`
- `back-asiinet/src/modules/user/user.controller.ts`
- `back-asiinet/src/modules/user/user.service.ts`
- `back-asiinet/src/modules/user/user.repository.ts`
- `back-asiinet/src/modules/user/user.entity.ts`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `back-asiinet/src/modules/user/user.controller.test.ts`
