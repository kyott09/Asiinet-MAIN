import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  canAccessTask,
  createRequireAuth,
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

test("users:write denies supervisor, operador, cliente, and unauthenticated requests", () => {
  for (const role of ["supervisor", "operador", "cliente", undefined]) {
    let nextCalledWith: unknown = null;
    const req = role ? { user: { id: 1, email: "user@example.invalid", role } } as any : {} as any;

    requirePermission("users:write")(req, {} as any, (error?: unknown) => {
      nextCalledWith = error;
    });

    assert.equal((nextCalledWith as any)?.statusCode, role ? 403 : 401);
  }
});

test("requireAuth uses the current database role instead of the JWT role", async () => {
  const secret = "auth-test-secret";
  const token = jwt.sign(
    { id: 17, email: "old@example.invalid", role: "admin" },
    secret,
    { expiresIn: "1h" }
  );
  const req = {
    headers: { cookie: `token=${token}` },
  } as any;
  let nextCalledWith: unknown = null;
  const middleware = createRequireAuth(async (id) => ({
    id,
    email: "current@example.invalid",
    role: "cliente",
  }), secret);

  await middleware(req, {} as any, (error?: unknown) => {
    nextCalledWith = error;
  });

  assert.equal(nextCalledWith, null);
  assert.deepEqual(req.user, {
    id: 17,
    email: "current@example.invalid",
    role: "cliente",
  });
});

test("requireAuth rejects a valid token when the account no longer exists", async () => {
  const secret = "auth-test-secret";
  const token = jwt.sign(
    { id: 17, email: "deleted@example.invalid", role: "admin" },
    secret,
    { expiresIn: "1h" }
  );
  const req = {
    headers: { cookie: `token=${token}` },
  } as any;
  let nextCalledWith: unknown = null;
  const middleware = createRequireAuth(async () => null, secret);

  await middleware(req, {} as any, (error?: unknown) => {
    nextCalledWith = error;
  });

  assert.equal((nextCalledWith as any)?.statusCode, 401);
});

test("users:write allows an administrator", () => {
  let nextCalled = false;

  requirePermission("users:write")(
    { user: { id: 1, email: "admin@example.invalid", role: "admin" } } as any,
    {} as any,
    (error?: unknown) => {
      assert.equal(error, undefined);
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
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
