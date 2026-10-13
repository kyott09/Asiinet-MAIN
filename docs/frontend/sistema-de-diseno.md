# Sistema de diseño del frontend

## Propósito

Registra los tokens globales, convenciones de estilos y apoyos de accesibilidad identificados en las hojas de estilo del frontend.

## Responsabilidades

`index.css` define en `:root` la paleta y aliases de color, familias tipográficas, escala de espaciado, radios, sombras, capas `z-index`, anillo de foco y transición rápida. Las hojas específicas reutilizan estos tokens mediante `var(...)` y agregan clases propias de cada página o componente.

| Grupo | Tokens declarados |
| --- | --- |
| Color | `--orange`, `--orange-dark`, `--white`, `--white-warm`, `--graphite`, `--warm-black`, `--ink`, `--text`, `--text-muted`, `--surface`, `--surface-soft`, `--canvas`, `--line`, `--black`, `--bg`, `--action`, `--action-hover`. |
| Tipografía | `--sans`, `--heading`, `--mono`, además de `font-family` raíz. |
| Espaciado | `--space-1` a `--space-6`, `--space-8`, `--space-10` y `--space-12`. |
| Forma y elevación | `--radius-sm` a `--radius-xl`, `--shadow-soft`, `--shadow-raised`. |
| Capas e interacción | `--z-base`, `--z-sidebar`, `--z-menu`, `--z-overlay`, `--z-dialog`, `--focus-ring`, `--transition-fast`. |

Los estilos globales fijan `box-sizing: border-box`, tipografía y color de fondo base, tamaños mínimos del documento y estilos comunes para controles y encabezados. Las reglas de página se mantienen en CSS asociado a la página; los componentes tienen hojas propias cuando corresponde. Se observan nombres de clase por área, como `tasks-*`, `users-*`, `calendar-*`, `sidebar-*` y `profile-*`; no se detectó una convención de CSS-in-JS.

## Cómo se conecta

`main.jsx` carga `index.css`; las páginas importan sus hojas CSS y los componentes del calendario y panel importan las propias. El valor `--focus-ring` existe como token; las reglas visibles de `:focus-visible` dibujan un contorno de 2 px y desplazamiento de 3 px con el naranja global.

`AppRoutes.jsx` incluye un enlace “Saltar al contenido principal” que apunta a `#main-content`. Las páginas del panel definen ese identificador en su elemento principal.

## Contratos

- La regla global `@media (prefers-reduced-motion: reduce)` reduce duración de animaciones y transiciones y desactiva el desplazamiento suave.
- `calendarTypes.js` exporta `EVENT_TYPES` como constante con tipos, etiquetas, colores e iconos; `EVENT_TYPE_LIST` se deriva de sus valores y `getEventTypeInfo` usa `otro` como fallback.

| Tipo | Color de la constante `EVENT_TYPES` |
| --- | --- |
| `reunion` | `#2B6CB0` |
| `cumpleanos` | `#805AD5` |
| `capacitacion` | `#2F855A` |
| `licencia` | `#C05621` |
| `otro` | `#64748B` |

## Reglas de negocio

El comentario en `index.css` indica que el texto blanco sobre el naranja principal no alcanza la relación de contraste WCAG AA y reserva blanco sobre naranja oscuro; el texto sobre naranja principal debe usar grafito. Los tipos de calendario y sus colores se consumen desde `Calendar.jsx` para la leyenda y desde componentes de evento.

## Errores y limitaciones conocidas

El foco visible, el enlace de salto y la preferencia de movimiento reducido se verificaron en el código; no se hizo una prueba manual de navegación por teclado, menú móvil ni layout responsive. Los breakpoints se definen en distintas hojas de cada página/componente, sin una escala global de breakpoints identificada: **No verificado** como sistema unificado.

## Archivos fuente

- `front-asiinet/asiinet/src/main.jsx`
- `front-asiinet/asiinet/src/index.css`
- `front-asiinet/asiinet/src/routes/AppRoutes.jsx`
- `front-asiinet/asiinet/src/constants/calendarTypes.js`
- `front-asiinet/asiinet/src/pages/Calendar.jsx`
- `front-asiinet/asiinet/src/components/calendar/Calendar.css`
- `front-asiinet/asiinet/src/components/dashboard/DashboardSidebar.css`
- `front-asiinet/asiinet/src/pages/Tareas.css`
- `front-asiinet/asiinet/src/pages/Users.css`
