# Cómo documentar

## Propósito

Define la plantilla y el criterio de mantenimiento para que la documentación técnica siga el código observado.

## Responsabilidades

Los documentos que describen comportamiento, código o contratos siguen esta estructura base. Índices y registros de discrepancias pueden usar secciones propias, pero conservan enlaces claros y `Archivos fuente`:

1. `Propósito`: alcance del documento.
2. `Responsabilidades`: comportamiento principal del área.
3. `Cómo se conecta`: relaciones con rutas, páginas, capas o módulos vecinos.
4. `Contratos`: endpoints, campos, respuestas, permisos o tokens de diseño según corresponda.
5. `Reglas de negocio`: decisiones implementadas y la función/archivo que las aplica.
6. `Errores y limitaciones conocidas`: errores, faltantes y aspectos sin verificación.
7. `Archivos fuente`: lista de archivos que sustentan el contenido.

Se pueden agregar subsecciones específicas, manteniendo esas secciones base y adaptando `Contratos` al tipo de documento. Cada afirmación importante debe poder relacionarse con un archivo y, cuando sea útil, con su función o componente.

## Cómo se conecta

El índice y orden recomendado están en [README](../README.md). Al cambiar código, actualizar el documento de su área en el mismo bloque de trabajo: módulos API en `docs/backend/`, navegación y vistas en `docs/frontend/`, configuración general en arquitectura/base de datos/autenticación, y operación/desarrollo en `docs/guias/`.

Actualizar también:

- `docs/arquitectura.md` cuando cambien aplicaciones, capas, prefijos de ruta, conexiones o configuración compartida.
- `docs/autenticacion-y-permisos.md` cuando cambien sesión, roles, permisos o protecciones por recurso.
- `docs/base-de-datos.md` cuando cambien entidades, campos, relaciones, restricciones o inicialización TypeORM.
- `docs/frontend/rutas-y-sesion.md`, `paginas.md`, `componentes.md`, `servicios.md` o `sistema-de-diseno.md` cuando cambie el área correspondiente.
- `docs/README.md` cuando se agreguen, muevan o renombren documentos o cambien limitaciones relevantes.
- `docs/discrepancias-con-claude-md.md` cuando se verifique una diferencia nueva con esas guías. Las guías originales se resuelven aparte.

## Contratos

La sección `Archivos fuente` es obligatoria. Debe enumerar las fuentes revisadas para ese documento, con rutas desde la raíz del repositorio; incluir pruebas cuando se describa cobertura. Para documentos que remiten a otra página, usar enlaces Markdown relativos y comprobar que resuelvan.

## Reglas de negocio

Documentar el comportamiento del código observado, no el comportamiento deseado. Si una regla proviene de una función concreta, identificarla por nombre y archivo. Si el comportamiento depende del entorno o de una ejecución no realizada, separar el hecho visible en código de lo que permanece sin confirmar.

Usar la frase **No verificado** cuando no se pudo confirmar una afirmación mediante código, configuración o ejecución autorizada. Agregar qué aspecto concreto falta confirmar y evitar presentar una inferencia como hecho. No completar valores o políticas basándose solo en nombres de variables.

## Errores y limitaciones conocidas

- No copiar secretos, credenciales, tokens, cookies, valores de `.env` ni datos privados a documentación, capturas, comandos o ejemplos.
- Para configuración, documentar solo el nombre y propósito de una variable. Si no se encontró uso, indicarlo sin revelar valores.
- Redactar limitaciones de forma neutral, describiendo el comportamiento observado y su alcance; evitar lenguaje de explotación o instrucciones para eludir controles.
- No modificar guías de referencia externas dentro de una tarea de documentación salvo que el alcance lo solicite expresamente; registrar diferencias comprobadas en el archivo de discrepancias.
- No borrar archivos solo porque parezcan inactivos: usar la marca **sin uso detectado** y enumerar la búsqueda realizada.

## Archivos fuente

- `docs/README.md`
- `docs/arquitectura.md`
- `docs/autenticacion-y-permisos.md`
- `docs/base-de-datos.md`
- `docs/backend/`
- `docs/frontend/`
- `docs/discrepancias-con-claude-md.md`
- `docs/guias/`
