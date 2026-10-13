# Rutas y sesión del frontend

## Propósito

Describe el enrutado del cliente, su lectura local de sesión y las restricciones de navegación implementadas en `AppRoutes.jsx`.

## Responsabilidades

`AppRoutes` monta `BrowserRouter` y declara estas rutas: `/` y `/login` muestran Login; `/register` muestra Register; `/home`, `/profile`, `/users`, `/galeria`, `/tareas` y `/calendario` muestran sus páginas; la ruta `*`, al final, muestra NotFound.

`ProtectedRoute` está definido dentro de `AppRoutes.jsx`. `getUserSession` lee y parsea `sessionStorage` bajo la clave `user`; ante ausencia o JSON inválido devuelve `null`. Si no hay usuario, `ProtectedRoute` redirige a `/login`. Si se indica `requireAdmin` y el rol no es exactamente `admin`, o si el rol no está incluido en `allowedRoles`, redirige a `/home`.

| Ruta | Condición en frontend |
| --- | --- |
| `/`, `/login`, `/register`, `*` | Sin `ProtectedRoute`. |
| `/home`, `/profile`, `/galeria`, `/tareas` | Requiere usuario en `sessionStorage`. |
| `/users` | Requiere usuario y `requireAdmin`. |
| `/calendario` | `allowedRoles`: `admin`, `supervisor`, `operador`. |

`allowedRoles` es una propiedad opcional de `ProtectedRoute`, comparada con el valor `user.role` guardado localmente. `requireAdmin` también es una comprobación del frontend.

## Cómo se conecta

El login llama `POST /api/users/login`, guarda `data.user` en `sessionStorage` y navega a `/home` (`Login.jsx`). El perfil actualiza esa entrada y emite el evento de ventana `asiinet:user-updated` después de cargar o guardar datos (`Profile.jsx`). `AccountActions` escucha ese evento y el evento `storage` para actualizar su copia del perfil. Cerrar sesión llama `POST /api/users/logout`, elimina `user` del almacenamiento local y navega a `/login`.

El estado local del frontend solo controla qué componentes se muestran y a qué rutas se permite navegar. La protección real de datos y operaciones está en el backend, que autentica las solicitudes y verifica permisos. Un usuario almacenado localmente no concede autorización al servidor.

## Contratos

- Ante una respuesta 401, `Profile.jsx` elimina `user` y redirige a `/login`, tanto al cargar como al guardar el perfil. `Tareas.jsx` elimina `user`; el detalle del destino posterior en todos los caminos 401 queda **No verificado**.
- `Users.jsx` y `calendarService.js` convierten respuestas HTTP fallidas en errores de página/solicitud; no se detectó en ellos un tratamiento específico de 401 que borre `sessionStorage`. `Login.jsx` y `Register.jsx` muestran el mensaje de error del servidor.
- `DashboardSidebar.jsx` lee `user` al renderizar para construir las opciones del menú: Usuarios solo para `admin`, Calendario para todo rol distinto de cliente según esa condición de menú, y tareas/solicitudes con etiqueta dependiente del rol. Esto no determina la política del servidor.
- `AppRoutes` incluye al final `<Route path="*" element={<NotFound />} />`, que presenta la página 404 para rutas no declaradas.

## Reglas de negocio

La única fuente usada por `ProtectedRoute` es la entrada local `user`; no consulta el backend para validar la sesión al resolver cada ruta. La autenticación por cookie y las reglas de autorización del servidor están descritas en [autenticación y permisos](../autenticacion-y-permisos.md).

## Errores y limitaciones conocidas

El menú móvil, el comportamiento con teclado y la disposición responsive no se probaron manualmente durante esta documentación; se describen según el código fuente. La sincronización del usuario entre pestañas depende del evento nativo `storage`; `asiinet:user-updated` sincroniza componentes de la misma ventana.

## Archivos fuente

- `front-asiinet/asiinet/src/routes/AppRoutes.jsx`
- `front-asiinet/asiinet/src/pages/Login.jsx`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `front-asiinet/asiinet/src/pages/Profile.jsx`
- `front-asiinet/asiinet/src/pages/Tareas.jsx`
- `front-asiinet/asiinet/src/pages/Users.jsx`
- `front-asiinet/asiinet/src/services/calendarService.js`
- `front-asiinet/asiinet/src/components/dashboard/AccountActions.jsx`
- `front-asiinet/asiinet/src/components/dashboard/DashboardSidebar.jsx`
- `back-asiinet/src/middlewares/auth.ts`
