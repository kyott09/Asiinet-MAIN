# Documentación técnica de Asiinet

## Propósito

Este índice organiza la documentación técnica del backend Express/TypeORM, el frontend React y las guías para operar y mantener el repositorio.

## Guía de lectura recomendada

1. [Arquitectura](arquitectura.md) para conocer las aplicaciones y su comunicación.
2. [Autenticación y permisos](autenticacion-y-permisos.md) y [base de datos](base-de-datos.md) para entender acceso y persistencia.
3. Los documentos de [módulos backend](#backend) y [frontend](#frontend) según el área que se modifica.
4. Las [guías de trabajo](#guias) para instalar, validar o actualizar la documentación.

## Índice

### Fundamentos

- [Arquitectura](arquitectura.md)
- [Autenticación y permisos](autenticacion-y-permisos.md)
- [Base de datos](base-de-datos.md)
- [Discrepancias con las guías Claude](discrepancias-con-claude-md.md)

### Backend

- [Módulo user](backend/user.md)
- [Módulo user-management](backend/user-management.md)
- [Módulo task](backend/task.md)
- [Módulo event](backend/event.md)
- [Módulo brand](backend/brand.md)
- [Módulo vehicle-model](backend/vehicle-model.md)
- [Módulo vehicle](backend/vehicle.md)
- [Middlewares](backend/middlewares.md)
- [Utilidades](backend/utils.md)
- [Errores](backend/errores.md)

### Frontend

- [Rutas y sesión](frontend/rutas-y-sesion.md)
- [Páginas](frontend/paginas.md)
- [Componentes](frontend/componentes.md)
- [Servicios](frontend/servicios.md)
- [Sistema de diseño](frontend/sistema-de-diseno.md)

### Guías

- [Puesta en marcha](guias/puesta-en-marcha.md)
- [Pruebas y validación](guias/pruebas-y-validacion.md)
- [Cómo documentar](guias/como-documentar.md)

## Limitaciones conocidas

- La API de marcas, modelos y vehículos está presente; no se encontraron pruebas automáticas ni pantallas frontend para esos módulos. La revisión de permisos queda pendiente.
- En Tareas, la interfaz muestra el botón de eliminar a supervisores y el backend reserva `tasks:delete` para admin.
- La cobertura automática del calendario no reemplaza la prueba manual con usuarios reales, que está pendiente.
- La navegación por teclado, el menú móvil y el layout responsive no se probaron manualmente.
- `synchronize: true` configura la sincronización del esquema al iniciar el backend; el estado de una base concreta no fue verificado.
- Las diferencias registradas con las guías Claude están enumeradas en [discrepancias-con-claude-md.md](discrepancias-con-claude-md.md) para resolución aparte.

## Archivos fuente

- `docs/arquitectura.md`
- `docs/autenticacion-y-permisos.md`
- `docs/base-de-datos.md`
- `docs/discrepancias-con-claude-md.md`
- `docs/backend/`
- `docs/frontend/`
- `docs/guias/`
