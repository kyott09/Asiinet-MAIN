# Puesta en marcha

## Propósito

Indica requisitos, instalación y comandos locales para iniciar el backend y el frontend de Asiinet.

## Responsabilidades

- Requisitos observados: Node.js, npm y un servidor MySQL accesible para el backend. **No verificado** el rango de versiones de Node.js y MySQL oficialmente soportado; no se encontró archivo de versión de Node en el repositorio.
- Cada aplicación tiene su propio `package.json` y `package-lock.json`; instalar dependencias desde el directorio de la aplicación correspondiente.
- El backend necesita configuración de conexión MySQL y claves de configuración para autenticación/cuentas iniciales. Los nombres y propósito están listados abajo, sin valores.

## Cómo se conecta

Desde la raíz del repositorio, instalar dependencias e iniciar en terminales separadas:

```sh
cd back-asiinet
npm ci
npm run dev
```

```sh
cd front-asiinet/asiinet
npm ci
npm run dev
```

El backend usa TypeScript con `tsx` y `nodemon` en modo desarrollo; el frontend usa Vite. `npm start` inicia el backend también mediante `tsx`, pero no configura reinicio al cambiar archivos.

Comandos disponibles por aplicación:

| Aplicación | Comando | Uso |
| --- | --- | --- |
| Backend | `npm run dev` | Servidor de desarrollo con reinicio al detectar cambios. |
| Backend | `npm start` | Inicia el servidor con `tsx`. |
| Backend | `npm test` | Ejecuta las pruebas automáticas del backend. |
| Backend | `npm run typecheck` | Ejecuta TypeScript sin emitir archivos. |
| Frontend | `npm run dev` | Inicia Vite para desarrollo. |
| Frontend | `npm run build` | Genera el build de producción. |
| Frontend | `npm run lint` | Ejecuta ESLint. |
| Frontend | `npm run preview` | Sirve localmente el build para previsualizarlo. |

## Contratos

### Variables de entorno

Los nombres provienen de `.env_example` y del código. Configurar el entorno fuera de la documentación; no copiar valores sensibles aquí.

| Nombre | Propósito observado |
| --- | --- |
| `PORT` | Puerto de escucha HTTP del backend; el código usa 8080 si no está configurado. |
| `DB_HOST` | Host del servidor MySQL. |
| `DB_PORT` | Puerto de MySQL usado por TypeORM. |
| `DB_NAME` | Base de datos usada por TypeORM. |
| `DB_USER` | Usuario de conexión MySQL. |
| `DB_PASS` | Contraseña de conexión MySQL. |
| `JWT_SECRET` | Firma y verificación de JWT en login y middleware. |
| `INITIAL_ACCOUNTS_PASSWORD` | Contraseña que el proceso de arranque usa al crear las cuentas iniciales. |
| `NODE_ENV` | Condiciona `secure` en la cookie y la validación de configuración inicial del backend. |
| `VITE_API_URL` | URL base que el frontend usa para construir solicitudes a la API. |
| `SECRET_KEY` | Figura en `.env_example`; no se detectó uso en el código. Propósito: **No verificado**. |
| `JWT_EXPIRES_IN` | Figura en `.env_example`; no se detectó uso en el código. |

### Puertos y CORS

- El backend escucha en `PORT`; si no se define, usa el puerto 8080.
- El servidor CORS permite los orígenes locales `http://localhost:5173`, `http://localhost:5174` y `http://localhost:5175`, habilita credenciales y acepta los métodos GET, POST, PUT, DELETE y OPTIONS.
- El script Vite `dev` usa el puerto 5174 y publica el host `0.0.0.0`. `preview` usa el puerto 4173.
- Las URLs permitidas por CORS y el puerto del servidor pueden necesitar coordinación si se cambia la configuración local.

### Sincronización del esquema

`AppDataSource` declara `synchronize: true`. TypeORM crea y sincroniza tablas al arrancar el backend según las entidades declaradas. Conviene respaldar la base antes de iniciar el backend, especialmente cuando ya contiene datos.

## Reglas de negocio

El proceso inicializa la base de datos antes de abrir el servidor HTTP. Si el backend ya estaba levantado desde otra rama, ese proceso no recarga automáticamente el código nuevo de esta rama: detenerlo y volver a iniciarlo desde el checkout que se desea ejecutar.

## Errores y limitaciones conocidas

Si el servidor no inicia, revisar que las dependencias estén instaladas, que MySQL sea accesible y que las variables requeridas estén configuradas fuera de este documento. No se documentan credenciales ni valores concretos. El resultado de una inicialización contra una base existente es dependiente de su esquema y queda **No verificado**.

## Archivos fuente

- `back-asiinet/package.json`
- `back-asiinet/.env_example` (se consultaron solo nombres de variables)
- `back-asiinet/src/index.ts`
- `back-asiinet/src/database/data-source.ts`
- `front-asiinet/asiinet/package.json`
- `front-asiinet/asiinet/vite.config.js`
