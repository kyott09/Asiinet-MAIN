import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoSeedCollisions,
  assertSeedApplyAllowed,
  assertSeedCleanupAllowed,
  runSeedMode,
  selectMissingSeedRecords,
} from "./seed-runtime.js";

test("la simulación inspecciona y devuelve conteos sin ejecutar escrituras", async () => {
  let writes = 0;
  let reported: unknown;
  const counts = await runSeedMode({
    apply: false,
    inspect: async () => ({ toCreate: 4, alreadyExists: 2 }),
    report: (inspection) => {
      reported = inspection;
    },
    persist: async () => {
      writes += 1;
    },
  });

  assert.deepEqual(counts, { toCreate: 4, alreadyExists: 2 });
  assert.deepEqual(reported, counts);
  assert.equal(writes, 0);
});

test("apply rechaza producción, host remoto y confirmación de base incorrecta", () => {
  const base = {
    apply: true,
    nodeEnv: "development",
    host: "localhost",
    database: "asiinet_dev",
    confirmedDatabase: "asiinet_dev",
  };

  assert.throws(() => assertSeedApplyAllowed({ ...base, nodeEnv: "production" }));
  assert.throws(() => assertSeedApplyAllowed({ ...base, host: "db.example.invalid" }));
  assert.throws(() => assertSeedApplyAllowed({ ...base, confirmedDatabase: "otra" }));
  assert.doesNotThrow(() => assertSeedApplyAllowed(base));
});

test("la limpieza aplicada requiere una confirmación aparte", () => {
  assert.throws(() => assertSeedCleanupAllowed({ apply: true }));
  assert.doesNotThrow(() => assertSeedCleanupAllowed({ apply: false }));
  assert.doesNotThrow(() => assertSeedCleanupAllowed({
    apply: true,
    confirmedCleanup: "DELETE-SEED-DATA",
  }));
});

test("la simulación aborta ante colisiones sin marcador y conserva solo conteos", () => {
  const counts = {
    existingEmails: 2,
    existingPlates: 1,
    existingBrands: 5,
    existingModels: 4,
    collisions: {
      emails: 1,
      plates: 0,
      brands: 0,
      models: 1,
    },
  };

  assert.deepEqual(
    Object.keys(counts).sort(),
    ["collisions", "existingBrands", "existingEmails", "existingModels", "existingPlates"]
  );
  assert.throws(() => assertNoSeedCollisions(counts.collisions));
});

test("una colisión impide persistir incluso con apply", async () => {
  let writes = 0;
  await assert.rejects(runSeedMode({
    apply: true,
    inspect: async () => ({ collisions: { emails: 1 } }),
    validate: ({ collisions }) => assertNoSeedCollisions(collisions),
    persist: async () => {
      writes += 1;
    },
  }));
  assert.equal(writes, 0);
});

test("la selección idempotente omite registros que ya existen", () => {
  const planned = ["mail-a", "mail-b", "mail-c"];
  const missing = selectMissingSeedRecords(planned, new Set(["mail-a", "mail-c"]), (value) => value);

  assert.deepEqual(missing, ["mail-b"]);
});
