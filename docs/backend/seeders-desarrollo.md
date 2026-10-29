# Seeders de desarrollo

## Propósito

Crear datos ficticios para probar solicitudes de servicio y la flota local sin agregar campos ni tablas al modelo. Los seeders no sustituyen el sembrado de cuentas que ejecuta el inicio del backend.

## Contenido generado

### Clientes y solicitudes

`seed:clientes` planifica 20 cuentas con rol `cliente` y 50 solicitudes distribuidas así:

| Servicio | Solicitudes |
|---|---:|
| Instalación | 12 |
| Reconexión | 12 |
| Servicio técnico | 13 |
| Desconexión | 13 |
| **Total** | **50** |

Cada cliente recibe dos o tres solicitudes sin repetir un servicio activo. Los cuerpos pasan por `parseTaskCreateInput` y `createTaskService.create` con actor cliente, por lo que conservan las reglas actuales: estado `Vista`, prioridad `Baja`, sin operador y `dueDate: null`. Cada solicitud usa detalles del servicio definidos en `shared/taskServiceDetails.js`. Veinticinco incluyen visita futura según `America/Argentina/Buenos_Aires` y una franja de `shared/taskVisitSlots.js`; las otras veinticinco no incluyen visita.

Las cuentas usan `clienteNN@seed.invalid`, nombres ficticios con el marcador `[SEED-DEV]` y una contraseña fija dentro del seeder, hasheada con `bcrypt.hash(..., 10)` igual que el registro. Esa contraseña es exclusivamente para desarrollo. El backend de registro no declara actualmente un esquema Zod de contraseña; el formulario web exige seis caracteres y la constante supera ese mínimo.

### Flota

`seed:flota` planifica cinco marcas ficticias, tres modelos por marca y quince vehículos (uno por modelo). Las patentes se generan de forma determinista con un formato aceptado por el validador real. Años, colores, estado y descripción usan campos y valores admitidos por las entidades y los schemas actuales. Todos los vehículos se crean con `employee_id: null`.

## Simulación, aplicación y seguridad

- Ambos comandos simulan por defecto y muestran exclusivamente conteos de filas previstas, existentes y colisiones. La simulación no escribe.
- `--apply` requiere que `NODE_ENV` no sea `production`, que el host configurado sea local y que `--confirm-database=<nombre>` coincida con la base configurada. Los detalles de conexión y hashes nunca se imprimen.
- Los scripts crean un DataSource independiente con `synchronize: false` y `migrationsRun: false`; no inicializan `AppDataSource`, no ejecutan migraciones ni cambian el esquema.
- La aplicación escribe dentro de una transacción. Los identificadores existentes se reutilizan solo cuando coinciden con el marcador y el registro esperado. Una colisión sin marcador detiene el seeder.
- Las solicitudes semilla se identifican con el marcador en `description` y la relación a cuentas `@seed.invalid`. Si ya hay solicitudes marcadas, no se agregan más.
- La limpieza también simula por defecto. Solo borra filas identificadas por las claves reservadas y marcador: tareas y cuentas cliente, vehículos, modelos y marcas. La limpieza requiere `--apply`, confirmación de base y `--confirm-cleanup=DELETE-SEED-DATA`; se ejecuta en transacción y en orden inverso a las claves foráneas. Registros con dependencias o marcadores discordantes hacen abortar la operación.
- No aplicar seeders ni limpieza sin respaldo y autorización explícita. El comando de limpieza no se ejecuta automáticamente después del seeding.

## Comandos

Ejecutar desde `back-asiinet`:

```bash
npm run seed:clientes
npm run seed:flota
npm run seed:clientes:clean
npm run seed:flota:clean
```

Los cuatro comandos anteriores son simulaciones. Para aplicar inserciones, añadir `-- --apply --confirm-database=<nombre>` al comando de seeding. Para ejecutar una limpieza, añadir además `-- --apply --confirm-database=<nombre> --confirm-cleanup=DELETE-SEED-DATA` al comando `:clean`. Se debe obtener un respaldo antes; los seeders no arrancan el servidor ni habilitan `synchronize`.

## Archivos fuente

- `back-asiinet/src/database/seeds/seed-runtime.ts`
- `back-asiinet/src/database/seeds/seed-clients.ts`
- `back-asiinet/src/database/seeds/seed-fleet.ts`
- `back-asiinet/src/database/seeds/run-seed-clients.ts`
- `back-asiinet/src/database/seeds/run-seed-fleet.ts`
- `back-asiinet/src/database/seeds/seed-clients.test.ts`
- `back-asiinet/src/database/seeds/seed-fleet.test.ts`
- `back-asiinet/src/database/seeds/seed-runtime.test.ts`
- `back-asiinet/package.json`
