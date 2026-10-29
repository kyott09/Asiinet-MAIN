import assert from "node:assert/strict";
import test from "node:test";
import { assertSeedApplyAllowed, runSeedMode } from "./seed-runtime.js";

test("la simulación inspecciona y devuelve conteos sin ejecutar escrituras", async () => {
  let writes = 0;
  const counts = await runSeedMode({
    apply: false,
    inspect: async () => ({ toCreate: 4, alreadyExists: 2 }),
    persist: async () => {
      writes += 1;
    },
  });

  assert.deepEqual(counts, { toCreate: 4, alreadyExists: 2 });
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
