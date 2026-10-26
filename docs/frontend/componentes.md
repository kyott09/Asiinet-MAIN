# Componentes del frontend

## Propósito

Resume los componentes reutilizables de autenticación, panel, galería y calendario, junto con sus funciones principales.

## Responsabilidades

### Autenticación

- `AuthLayout` presenta el marco visual, logotipo, título, contenido y pie para las vistas de acceso/registro.
- `TextField` representa una entrada etiquetada controlada con opciones de tipo, obligatoriedad y longitud mínima.
- `PasswordField` representa una entrada de contraseña controlada y alterna su visibilidad.
- `RememberMe.jsx`: **sin uso detectado**; no se encontraron importaciones o referencias activas en el frontend revisado.

### Panel

- `DashboardSidebar` arma la navegación a partir del usuario local y controla abrir/cerrar el menú pequeño; cierra con Escape cuando coincide el breakpoint móvil.
- `AccountActions` muestra perfil, nombre/rol y acción de logout; escucha `storage` y `asiinet:user-updated` para sincronizar el perfil local.

### Galería

- `GalleryCarousel` mantiene el índice, avanza automáticamente cada cinco segundos, permite desplazamiento por controles y usa una secuencia duplicada para el bucle visual.
- `GalleryArrows` presenta controles de foto anterior/siguiente.
- `GalleryIndicators` presenta controles directos para elegir una foto e indica la selección actual.

### Calendario

- `CalendarHeader` presenta mes/año y controles de mes anterior, siguiente y hoy.
- `CalendarGrid` calcula los días y espacios iniciales del mes, agrupa eventos por fecha y renderiza celdas.
- `CalendarDay` presenta el día, hasta tres eventos visibles y un indicador de cantidad adicional; responde a clic, Enter y espacio.
- `CalendarEvent` representa resumen, tipo y propiedad visual de un evento usando `getEventTypeInfo`.
- `CalendarEventModal` gestiona modos de lista, creación, edición y confirmación de borrado; llama callbacks recibidos por props.

### Vehículos

- `VehiclesTab`, `ModelsTab` y `BrandsTab` presentan las tres colecciones del módulo.
- `VehicleModal`, `ModelModal` y `BrandModal` gestionan altas y ediciones para roles con `vehicles:write`.
- `ConfirmDeleteModal` solicita confirmación para eliminaciones.
- `Vehiculos.jsx` gestiona las pestañas accesibles, filtros, carga, errores, permisos de escritura y retorno del foco en los diálogos.

### Elemento de interfaz

`ActionButton.css` define estilos compartidos de `.auth-submit` y variantes; lo importa `AuthLayout`. `UserList.jsx`: **sin uso detectado**; no se encontraron importaciones o referencias activas en el frontend revisado.

## Cómo se conecta

Las páginas componen estos elementos: `Login` y `Register` usan `AuthLayout`, `TextField` y `PasswordField`; las páginas del panel usan `DashboardSidebar` y `AccountActions`; `Home` integra `GalleryCarousel` para clientes; `Calendar` organiza header, grilla, modal y tipos de eventos. El modal del calendario recibe operaciones por callbacks desde `Calendar.jsx`.

## Contratos

Estos componentes reciben datos y callbacks por props, salvo los del panel que leen estado local de sesión y el carrusel que administra su temporizador. No hacen llamadas al API los componentes de calendario; el servicio de calendario usado por la página está en [servicios](servicios.md).

## Reglas de negocio

La edición y eliminación de eventos se presenta en el modal cuando `event.esPropio` es verdadero. La autorización efectiva se realiza también en el backend. El carrusel rota automáticamente y sus controles permiten cambiar o seleccionar la imagen.

## Errores y limitaciones conocidas

El menú móvil, su respuesta a Escape y el uso de teclado de los controles no se probaron manualmente durante esta documentación; la descripción se basa en el código. `UserList.jsx` y `RememberMe.jsx` se documentan como **sin uso detectado**, sin eliminarlos.

## Archivos fuente

- `front-asiinet/asiinet/src/components/auth/AuthLayout.jsx`
- `front-asiinet/asiinet/src/components/auth/PasswordField.jsx`
- `front-asiinet/asiinet/src/components/auth/TextField.jsx`
- `front-asiinet/asiinet/src/components/auth/RememberMe.jsx`
- `front-asiinet/asiinet/src/components/dashboard/AccountActions.jsx`
- `front-asiinet/asiinet/src/components/dashboard/DashboardSidebar.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryCarousel.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryArrows.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryIndicators.jsx`
- `front-asiinet/asiinet/src/components/calendar/CalendarHeader.jsx`
- `front-asiinet/asiinet/src/components/calendar/CalendarGrid.jsx`
- `front-asiinet/asiinet/src/components/calendar/CalendarDay.jsx`
- `front-asiinet/asiinet/src/components/calendar/CalendarEvent.jsx`
- `front-asiinet/asiinet/src/components/calendar/CalendarEventModal.jsx`
- `front-asiinet/asiinet/src/components/ui/ActionButton.css`
- `front-asiinet/asiinet/src/components/UserList.jsx`
- `front-asiinet/asiinet/src/pages/Login.jsx`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `front-asiinet/asiinet/src/pages/Vehiculos/Vehiculos.jsx`
- `front-asiinet/asiinet/src/pages/Vehiculos/components/`
- `front-asiinet/asiinet/src/pages/Home/index.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryCarousel.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryArrows.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryIndicators.jsx`
