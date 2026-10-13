# Pruebas y validación

## Propósito

Resume la cobertura automatizada declarada por el repositorio, los comandos disponibles y las verificaciones manuales pendientes.

## Responsabilidades

Las pruebas automáticas encontradas son pruebas de backend ejecutadas con `node:test` mediante `tsx`. Por sus casos, cubren:

- **Autenticación y autorización:** normalización de roles, permisos generales, sesión consultada contra la base, cuentas inexistentes, y acceso a tareas.
- **Usuarios:** registro público con rol cliente, serialización sin hash y normalización/formato de fechas.
- **Gestión de usuarios:** campos/roles permitidos, duplicados, protección del último admin, autoeliminación, asignaciones de tareas, cambios de rol y límites de contraseña administrativa por bytes UTF-8.
- **Tareas:** validación de los payloads de creación de cliente y actualización de operador/cliente.
- **Eventos:** permisos de calendario, validación de entradas/mes, fechas, propiedad, 403 para otro actor y `esPropio`.
- **Sembrado:** creación idempotente de dos clientes y dos operadores y reparación de roles de cuentas demo sin cambiar contraseñas existentes.

## Cómo se conecta

| Aplicación | Comando | Función |
| --- | --- | --- |
| Backend | `npm test` | Ejecuta `tsx --test src/**/*.test.ts`. |
| Backend | `npm run typecheck` | Ejecuta `tsc --noEmit`. |
| Frontend | `npm run lint` | Ejecuta ESLint sobre el frontend. |
| Frontend | `npm run build` | Genera el build Vite. |

Los comandos deben ejecutarse desde el directorio de la aplicación. El frontend no declara un script de pruebas automatizadas ni se encontraron archivos de pruebas frontend.

## Contratos

La cobertura encontrada no incluye pruebas automáticas para marcas (`brand`), modelos (`vehicle-model`) ni vehículos (`vehicle`). No cubre automatizadamente ningún componente, página o flujo del frontend. La inspección de archivos de prueba confirma presencia de las suites enumeradas; no se ejecutaron durante esta tarea.

Verificaciones manuales pendientes:

- Calendario con usuarios reales, incluyendo propiedad de eventos y acciones de usuarios distintos.
- Interfaz administrativa `/users` con una sesión real y sus respuestas al API.
- Navegación completa con teclado, foco y Escape en menús y diálogos.
- Menú móvil y layout responsive en distintos tamaños de viewport.

## Reglas de negocio

Una prueba automatizada muestra el comportamiento de su escenario, pero no confirma por sí sola el despliegue, la configuración o la experiencia visual de un entorno real. La discrepancia entre el botón de eliminar para supervisores en `Tareas.jsx` y el permiso backend `tasks:delete` está descrita en [páginas](../frontend/paginas.md).

## Errores y limitaciones conocidas

No se validaron aquí servicios externos, una base de datos conectada, configuración de CORS desplegada ni navegadores reales. Esos estados quedan **No verificado** en esta ejecución; las comprobaciones manuales anteriores siguen pendientes.

## Archivos fuente

- `back-asiinet/package.json`
- `front-asiinet/asiinet/package.json`
- `back-asiinet/src/middlewares/auth.test.ts`
- `back-asiinet/src/modules/user/user.controller.test.ts`
- `back-asiinet/src/modules/user/user.service.test.ts`
- `back-asiinet/src/modules/user/user-management.service.test.ts`
- `back-asiinet/src/modules/task/task.controller.test.ts`
- `back-asiinet/src/modules/event/event.controller.test.ts`
- `back-asiinet/src/database/seed-default-users.test.ts`
- `front-asiinet/asiinet/src/pages/Users.jsx`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `front-asiinet/asiinet/src/components/dashboard/DashboardSidebar.jsx`
