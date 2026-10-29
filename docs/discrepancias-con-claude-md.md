# Discrepancias con las guías de Claude

## Propósito

Este documento registra afirmaciones de `CLAUDE.md` y `CLAUDE_FRONTEND_BRIEF.md` que todavía no coinciden con los archivos actuales. Las discrepancias de rutas de Home se actualizaron en ambas guías.

## Responsabilidades

Mantener visibles las diferencias comprobadas para que las guías puedan corregirse aparte. Este registro no modifica ni reemplaza los archivos Claude.

## Cómo se conecta

Cada fila vincula el texto de una guía con los archivos de implementación que permiten verificarlo.

## Contratos

No aplica: este archivo registra discrepancias documentales y no define contratos de API.

## Reglas de negocio

No aplica: este archivo no agrega ni cambia reglas del sistema.

## Discrepancias comprobadas

| Guía | Afirmación de la guía | Código observado |
| --- | --- | --- |
| `CLAUDE.md` | El resumen inicial enumera únicamente las entidades `User` y `Task`; también describe el montaje como rutas de usuarios y tareas. | `data-source.ts` registra `User`, `Task`, `Brand`, `VehicleModel`, `Vehicle` y `Event`. `index.ts` monta los prefijos `/api/users`, `/api/tasks`, `/api/brands`, `/api/vehicle-models`, `/api/vehicles` y `/api/events`. |
| `CLAUDE.md` | Los estilos globales están en `src/index.css` y `src/App.css`. | `src/index.css` existe; no se encontró `src/App.css` en el árbol actual. |
| Ambas guías | La descripción anterior de vehículos, marcas y modelos no reflejaba su implementación actual. | El backend tiene módulos y 16 rutas protegidas; el frontend incluye `/vehiculos`, sus pestañas y `vehicleService.js`. La documentación actualizada describe esos contratos. |
| `CLAUDE_FRONTEND_BRIEF.md` | No hay evidencia de backend para calendario. | Hay módulo `event`, rutas bajo `/api/events` y una página Calendar que consume la API. La propia tabla de rutas del brief también describe el calendario conectado. |
| `CLAUDE_FRONTEND_BRIEF.md` | Login y Register tienen la URL de API escrita directamente. | Ambos archivos leen `import.meta.env.VITE_API_URL` y usan una alternativa definida en el código. |

## Limitaciones conocidas

Este registro compara texto y código fuente; no valida la ejecución de las aplicaciones ni el estado de una base de datos.

## Errores

No aplica: este archivo no define ni describe respuestas de error de la API.

## Archivos fuente

- `CLAUDE.md`
- `CLAUDE_FRONTEND_BRIEF.md`
- `back-asiinet/src/index.ts`
- `back-asiinet/src/database/data-source.ts`
- `front-asiinet/asiinet/src/routes/AppRoutes.jsx`
- `front-asiinet/asiinet/src/pages/NotFound.jsx`
- `front-asiinet/asiinet/src/pages/Home/Home.jsx`
- `front-asiinet/asiinet/src/pages/Panel.jsx`
- `front-asiinet/asiinet/src/components/gallery/GalleryCarousel.jsx`
- `front-asiinet/asiinet/src/pages/Login.jsx`
- `front-asiinet/asiinet/src/pages/Register.jsx`
- `front-asiinet/asiinet/src/index.css`
- `front-asiinet/asiinet/src/App.css` (comprobado como ausente)
