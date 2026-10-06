# Asiinet — brief para reconstruir el frontend

## Objetivo para Claude

Rediseñar y reconstruir el frontend de Asiinet como una aplicación web clara, moderna, responsive y consistente, manteniendo la integración actual con la API. Antes de cambiar código, inspeccionar el frontend y el backend reales: este documento resume el estado observado y no reemplaza los contratos implementados.

Conservar React, Vite y React Router salvo que exista una razón técnica concreta para proponer otra cosa. No rehacer el backend, no inventar endpoints ni presentar como funcionales módulos que todavía no existen. Si se propone una función nueva que requiera cambios de API, señalarla como futura y separarla del trabajo de interfaz.

## Qué es Asiinet

Asiinet es una empresa contratista que brinda internet por cable a clientes residenciales y comerciales. El sistema apunta a centralizar operaciones que actualmente se gestionan en papel: pedidos de servicio, planificación y seguimiento de tareas, personal, vehículos y materiales.

El producto está pensado como una herramienta interna de gestión. Los perfiles de interés que se desprenden del código y del dominio son:

- **Administración:** supervisa usuarios y operaciones.
- **Personal operativo/empleados:** consulta o gestiona el trabajo asignado.
- **Clientes:** pueden figurar como solicitantes asociados a una tarea.

Los roles `admin`, `user`, `cliente` y `empleado` aparecen en distintos puntos del proyecto. La interfaz actual no tiene un flujo completo para crear o administrar todos esos tipos de usuario; validar cualquier experiencia nueva contra los roles y operaciones que realmente soporta la API.

## Tecnología y estructura real

- **Frontend:** React 19, JavaScript/JSX, Vite y React Router DOM 7.
- **Estilos:** CSS; las pantallas usan estilos globales y hojas CSS por componente/página. Font Awesome está instalado.
- **Backend:** Node.js, Express 5, TypeScript, TypeORM y MySQL (`mysql2`), autenticación JWT en cookie HTTP-only.
- **Puerto del frontend:** Vite está configurado en `http://localhost:5174`.
- **Puerto del backend:** por defecto `http://localhost:8080`.
- El frontend usa `import.meta.env.VITE_API_URL` en algunas pantallas (por defecto `http://localhost:8080`); login y registro tienen esa URL escrita directamente.

Directorios importantes:

- `front-asiinet/asiinet/src/pages/`: pantallas.
- `front-asiinet/asiinet/src/components/`: navegación, autenticación, perfil y componentes reutilizables.
- `front-asiinet/asiinet/src/assets/brand/`: logos de Asiinet.
- `back-asiinet/src/modules/user/`: usuarios y autenticación.
- `back-asiinet/src/modules/task/`: tareas.

**Nota sobre documentación:** algunos README mencionan Tailwind, Prisma, PostgreSQL u otros puertos; no coinciden con las dependencias y el código actuales. Para implementar, tomar como fuente de verdad los `package.json`, `vite.config.js` y `src/` de cada aplicación, además de los endpoints reales.

## Identidad visual existente

Usar los recursos de marca existentes en `front-asiinet/asiinet/src/assets/brand/` en vez de recrear o sustituir el logo sin necesidad. El sistema visual actual usa:

- Naranja principal `#F65C17` y naranja oscuro `#A5350F`.
- Grafito `#302824`, negro cálido `#13110F` y fondos gris verdoso claro alrededor de `#EBF1EB`.
- Interfaz predominantemente clara, con superficies blancas, bordes sobrios y acentos naranjas.
- Tipografía de sistema como base; algunas pantallas usan Arial.

Hay logos e imágenes de marca en las carpetas `brand/images`, `brand/logos` y `brand/icons`, además de tres fotos `foto1.jpg`, `foto2.jpg` y `foto3.jpg` en `src/assets/`. Reutilizar y verificar visualmente las variantes apropiadas.

El frontend actual ya contempla layouts de panel con barra lateral, encabezado de cuenta, tablas/listas, estados vacíos y formularios. La reconstrucción puede mejorar jerarquía, espaciado, navegación, coherencia entre pantallas, accesibilidad y experiencia móvil; no tiene que conservar el diseño actual pixel por pixel.

## Pantallas y rutas actuales

Las rutas registradas en `src/routes/AppRoutes.jsx` son:

| Ruta | Pantalla | Acceso / función actual |
|---|---|---|
| `/` y `/login` | Iniciar sesión | Formulario de autenticación. |
| `/register` | Crear cuenta | Registro con nombre, email y contraseña. |
| `/home` | Inicio | Introducción al sistema y conceptos generales. Requiere sesión. |
| `/profile` | Perfil | Editar nombre, email, foto, fecha de nacimiento y domicilio. Requiere sesión. |
| `/users` | Usuarios | Protegida para `role === "admin"`; actualmente muestra datos de ejemplo estáticos, no un listado cargado desde API. |
| `/galeria` | Galería de fotos | Protegida; utiliza tres fotos locales. |
| `/tareas` | Tareas | Protegida; CRUD conectado a la API. |

La barra lateral también muestra enlaces a `/vehiculos`, `/empleados`, `/roles`, `/calendario` y `/documentacion`, pero esas rutas no están implementadas en el router actual. No tratarlas como pantallas existentes ni simular que guardan datos reales. Se pueden proponer en una fase futura.

No se ve una ruta catch-all para direcciones desconocidas. Considerar una pantalla 404 en la reconstrucción, sin cambiar las rutas válidas.

## Funcionalidad existente que debe preservarse

### Autenticación y sesión

- Inicio de sesión: `POST /api/users/login`, cuerpo `{ email, password }`; el backend devuelve el usuario y establece una cookie de sesión HTTP-only.
- Registro: `POST /api/users/register`. La interfaz envía `nombre`, `email`, `password` y `role: "user"`.
- El usuario devuelto se guarda en `sessionStorage` bajo la clave `user`.
- La navegación protegida redirige a `/login` cuando no encuentra usuario en `sessionStorage`; `/users` requiere rol `admin`.
- Cierre de sesión: `POST /api/users/logout`, con `credentials: "include"`, y posterior limpieza del usuario local.
- Las peticiones autenticadas deben conservar `credentials: "include"`.
- Mostrar estados de carga y errores de la API; no reemplazarlos por éxito ficticio.

### Perfil

- `GET /api/users/me` carga los datos actuales; `PUT /api/users/me` actualiza `nombre`, `email`, `fechaNacimiento`, `domicilio` y `fotoPerfil`.
- Campos opcionales de perfil: fecha, domicilio y foto.
- La foto actualmente se lee en el navegador como Data URL. Al actualizar el usuario, el frontend actualiza también `sessionStorage` y emite `asiinet:user-updated`.
- Un `401` elimina la sesión local y redirige a inicio de sesión.

### Tareas

- Endpoints autenticados:
  - `GET /api/tasks` → `{ tasks }`
  - `POST /api/tasks` → `{ task }`
  - `PUT /api/tasks/:id` → `{ task }`
  - `DELETE /api/tasks/:id` → confirmación de eliminación
- Para asignar una tarea se usa `GET /api/users/assignables` → `{ clients, employees }`.
- Campos de alta/edición: `clientId`, `employeeId`, `dueDate`, `description`, `service`, `priority` y `status`.
- La fecha de finalización no puede ser anterior a la fecha de creación.
- Servicios válidos: `Instalación`, `Reconexión`, `Servicio técnico`, `Desconexión`.
- Prioridades: `Baja`, `Media`, `Alta`.
- Estados: `Vista`, `En proceso`, `Terminada`, `No terminada`.
- La pantalla actual soporta alta, edición y eliminación con confirmación; muestra número, cliente, empleado, fechas, servicio, prioridad, estado y descripción.
- En pantallas estrechas existe una representación en tarjetas en lugar de la tabla.
- La API solo permite asociar clientes con rol `cliente` y empleados con rol `empleado`. El formulario no puede asignar hasta que existan usuarios de esos roles.

### Inicio, navegación y galería

- Inicio explica los objetivos del producto, tipos de servicio y conceptos operativos.
- La navegación del panel incluye marca, secciones de registrar y accesos a galería, calendario y documentación. La entrada de registro se puede expandir; roles se muestra condicionalmente a administradores.
- El encabezado de cuenta enlaza al perfil, muestra el nombre/avatar y permite cerrar sesión.
- La galería usa tres imágenes locales y tiene componentes de carrusel, flechas e indicadores en el código fuente.

## Visión funcional del producto (no confundir con lo implementado)

El inicio menciona áreas que describen el alcance deseado, pero todavía no tienen su propio CRUD/API completo en este repositorio:

- **Órdenes de trabajo:** flujo previsto `nueva → vista → en proceso → terminada / no terminada`.
- **Móviles y equipos:** cuadrillas de 2 o 3 empleados asignadas a vehículos; integrantes variables.
- **Rendimiento:** productividad semanal y priorización para clientes premium.
- **Stock:** materiales como precintos, tarugos, módems y routers, con alertas de reposición.
- **Vehículos:** verificaciones técnicas, neumáticos y mantenimiento.
- Módulos previstos que aparecen en la navegación: vehículos, empleados, roles, calendario y documentación.

La pantalla de tareas sí permite actualmente registrar y cambiar estado de tareas, pero no hay evidencia en el backend actual de órdenes asociadas a móviles, inventario, mantenimiento, ranking o calendario. No presentar esos módulos como implementados hasta que exista backend correspondiente.

## Pautas de experiencia para la reconstrucción

1. Diseñar un panel operativo fácil de escanear: navegación persistente y clara, contenido con jerarquía, acciones primarias visibles e indicadores legibles para prioridades/estados.
2. Unificar el lenguaje visual entre login/registro y las pantallas autenticadas, manteniendo marca, contraste, tipografía y estados de foco coherentes.
3. Hacer que las vistas de tareas y perfil funcionen bien en móvil, tablet y escritorio; evitar tablas que desborden sin alternativa usable.
4. Contemplar carga, error, éxito, lista vacía, falta de permisos y sesión vencida. No ocultar errores reales de API.
5. Mantener navegación por teclado, etiquetas de formulario, nombres accesibles para iconos/controles, foco visible y confirmación clara para acciones destructivas.
6. Usar textos en español rioplatense de forma consistente (por ejemplo, “Iniciá sesión”, “Guardá cambios”), sin mezclar idiomas innecesariamente.
7. No agregar pantallas o datos de muestra que aparenten persistencia real. Si se necesitan mocks para una propuesta visual, identificarlos explícitamente y separarlos del flujo conectado a API.
8. Evitar cambiar contratos API, roles, almacenamiento de sesión o reglas de negocio solo para facilitar el diseño. Si algún contrato debe cambiar, documentar el impacto y pedir confirmación antes de hacerlo.

## Advertencias sobre el estado actual del árbol

- El estado visual completo no quedó verificado en el navegador compartido durante la preparación de este brief; validar las pantallas arrancando frontend y backend localmente.
- Hay cambios locales preexistentes sin confirmar. Revisar `git status` antes de editar y preservar cualquier trabajo existente.
- En el árbol inspeccionado, `Gallery.jsx` hace referencia a `AccountActions` y `GalleryCarousel`, pero no aparecen importados en ese archivo. Verificar y corregir este tipo de inconsistencias al reconstruir; no asumir que toda la interfaz actual compila o está terminada.
- El registro pide “Usuario” y “Nombre completo”, pero el backend solo persiste `nombre`; el nombre de usuario no es un campo del modelo actual.
- La pantalla `/users` es una muestra estática. El endpoint de usuarios disponible en este momento se limita a datos del usuario actual y usuarios asignables para las tareas; no hay un endpoint general de administración CRUD en las rutas inspeccionadas.
- No copiar secretos ni datos de `.env` a código, documentación pública o mensajes.

## Criterios de aceptación sugeridos

- Las rutas existentes conservan sus funciones y protección de sesión/rol.
- Login, registro, perfil y CRUD de tareas siguen hablando con los endpoints descritos, usando cookies de credenciales.
- La UI se entiende en escritorio y móvil y tiene estados de carga, error y contenido vacío.
- La marca usa los logos/colores del proyecto y la navegación no apunta a pantallas inexistentes como si fueran funcionales.
- Los módulos futuros quedan identificados como prototipos o pendientes de backend.
- La aplicación compila y pasa los scripts disponibles del frontend (`npm run build` y `npm run lint`).

## Instrucción lista para reutilizar con Claude

> Lee `CLAUDE_FRONTEND_BRIEF.md` y luego inspecciona el código real de frontend y backend antes de modificar nada. Quiero que reconstruyas el frontend de Asiinet con una interfaz moderna, coherente, responsive y en español, conservando las integraciones y reglas actuales. Primero identifica el plan de cambios y cualquier limitación de API; después implementa las pantallas existentes de forma completa, sin inventar endpoints, sin borrar cambios locales y sin presentar módulos futuros como funcionales. Reutiliza los recursos de marca y valida el resultado con el build y lint existentes. Si una decisión requiere cambiar el alcance o el backend, explícala y consulta antes.
