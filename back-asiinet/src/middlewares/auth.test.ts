import test from "node:test";
import assert from "node:assert/strict";

import {
  canAccessTask,
  hasPermission,
  normalizeRole,
  requirePermission,
} from "./auth.js";

test("normalizeRole keeps admin and maps legacy roles", () => {
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("empleado"), "operador");
  assert.equal(normalizeRole("user"), "cliente");
});

test("admin has every permission and cliente is restricted", () => {
  assert.equal(hasPermission("admin", "tasks:delete"), true);
  assert.equal(hasPermission("cliente", "tasks:delete"), false);
  assert.equal(hasPermission("cliente", "gallery:read"), true);
  assert.equal(hasPermission("cliente", "tasks:create"), true);
  assert.equal(hasPermission("cliente", "tasks:update"), true);
});

test("requirePermission denies unauthenticated requests", () => {
  let nextCalledWith: unknown = null;
  const req = {} as any;
  const res = {} as any;
  const next = (err?: unknown) => {
    nextCalledWith = err;
  };

  requirePermission("users:read")(req, res, next);

  assert.ok(nextCalledWith);
  assert.equal((nextCalledWith as any)?.statusCode, 401);
});

test("operador can only access their assigned task and not a foreign one", () => {
  const myTask = { id: 12, clientId: 2, employeeId: 7 };
  const otherTask = { id: 13, clientId: 10, employeeId: 15 };

  assert.equal(canAccessTask({ id: 7, role: "operador" }, myTask, "update"), true);
  assert.equal(canAccessTask({ id: 7, role: "operador" }, otherTask, "update"), false);

  const clientUser = { id: 2, role: "cliente" };
  assert.equal(canAccessTask(clientUser, myTask, "read"), true);
  assert.equal(canAccessTask(clientUser, otherTask, "read"), false);
  assert.equal(canAccessTask(clientUser, myTask, "update"), true);
  assert.equal(canAccessTask(clientUser, otherTask, "update"), false);
});
