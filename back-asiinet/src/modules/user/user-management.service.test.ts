import assert from "node:assert/strict";
import test from "node:test";
import type { User } from "./user.entity.js";
import {
  createUserManagementService,
  type UserManagementStore,
} from "./user-management.service.js";

const makeUser = (
  id: number,
  role: string,
  overrides: Partial<User> = {}
): User => ({
  id,
  nombre: `Usuario ${id}`,
  email: `usuario${id}@example.invalid`,
  passwordHash: "stored-hash",
  role,
  fechaNacimiento: null,
  domicilio: null,
  fotoPerfil: null,
  creadoEn: new Date("2025-01-01T00:00:00.000Z"),
  ...overrides,
});

const makeStore = (
  initialUsers: User[] = [],
  taskAssignments: Record<number, { client: number; employee: number }> = {}
) => {
  const users = new Map(initialUsers.map((user) => [user.id, { ...user }]));
  let lock: Promise<void> = Promise.resolve();

  const findByEmail = async (email: string) =>
    [...users.values()].find((user) => user.email === email) ?? null;
  const updateUser = async (id: number, data: Partial<User>) => {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    users.set(id, updated);
    return updated;
  };
  const deleteUser = async (id: number) => users.delete(id);

  const store: UserManagementStore = {
    findAll: async () => [...users.values()],
    findByEmail,
    create: async (data) => {
      const id = Math.max(0, ...users.keys()) + 1;
      const user = makeUser(id, data.role ?? "cliente", data);
      users.set(id, user);
      return user;
    },
    withAdminRowsLocked: async (operation) => {
      const previousLock = lock;
      let releaseLock!: () => void;
      lock = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      await previousLock;

      try {
        const admins = [...users.values()].filter((user) => user.role === "admin");
        return await operation(
          admins,
          {
            findByIdForUpdate: async (id) => users.get(id) ?? null,
            findByEmail,
            countTaskAssignments: async (id) => taskAssignments[id] ?? { client: 0, employee: 0 },
            updateUser,
            deleteUser,
          }
        );
      } finally {
        releaseLock();
      }
    },
  };

  return { store, users };
};

const serviceFor = (
  initialUsers: User[] = [],
  taskAssignments: Record<number, { client: number; employee: number }> = {}
) => {
  const { store, users } = makeStore(initialUsers, taskAssignments);
  return { service: createUserManagementService(store), users };
};

test("lists only the administrative user fields and normalizes roles", async () => {
  const { service } = serviceFor([
    makeUser(1, "user"),
    makeUser(2, "empleado"),
  ]);

  assert.deepEqual(await service.list(), [
    {
      id: 1,
      nombre: "Usuario 1",
      email: "usuario1@example.invalid",
      role: "cliente",
      creadoEn: new Date("2025-01-01T00:00:00.000Z"),
    },
    {
      id: 2,
      nombre: "Usuario 2",
      email: "usuario2@example.invalid",
      role: "operador",
      creadoEn: new Date("2025-01-01T00:00:00.000Z"),
    },
  ]);
});

test("creates an administrative account with an accepted role and no hash in the response", async () => {
  const { service } = serviceFor();
  const created = await service.create({
    nombre: "Nueva cuenta",
    email: "nueva@example.invalid",
    password: "abcdefgh",
    role: "employee",
  });

  assert.equal(created.role, "operador");
  assert.equal("passwordHash" in created, false);
});

test("rejects request fields outside the administrative user allowlist", async () => {
  const { service } = serviceFor();

  await assert.rejects(
    service.create({
      nombre: "Nueva cuenta",
      email: "nueva@example.invalid",
      password: "abcdefgh",
      role: "cliente",
      passwordHash: "injected",
    }),
    { code: "BAD_REQUEST" }
  );
});

test("rejects an invalid administrative role", async () => {
  const { service } = serviceFor();

  await assert.rejects(
    service.create({
      nombre: "Nueva cuenta",
      email: "nueva@example.invalid",
      password: "abcdefgh",
      role: "root",
    }),
    { code: "BAD_REQUEST" }
  );
});

test("rejects an email already used by another account", async () => {
  const { service } = serviceFor([makeUser(1, "cliente")]);

  await assert.rejects(
    service.create({
      nombre: "Duplicado",
      email: "usuario1@example.invalid",
      password: "abcdefgh",
      role: "cliente",
    }),
    { code: "CONFLICT" }
  );
});

test("updates only the allowed fields and returns no password hash", async () => {
  const { service } = serviceFor([makeUser(1, "cliente")]);
  const updated = await service.update(
    1,
    { nombre: "Nombre cambiado", email: "nuevo@example.invalid", role: "supervisor" },
    2
  );

  assert.equal(updated.nombre, "Nombre cambiado");
  assert.equal(updated.email, "nuevo@example.invalid");
  assert.equal(updated.role, "supervisor");
  assert.equal("passwordHash" in updated, false);
});

test("prevents an administrator from deleting their own account or removing their own role", async () => {
  const { service } = serviceFor([makeUser(1, "admin"), makeUser(2, "admin")]);

  await assert.rejects(service.delete(1, 1), { code: "FORBIDDEN" });
  await assert.rejects(
    service.update(1, { role: "supervisor" }, 1),
    { code: "FORBIDDEN" }
  );
});

test("protects the last administrator against deletion and demotion", async () => {
  const { service } = serviceFor([makeUser(1, "admin"), makeUser(2, "cliente")]);

  await assert.rejects(service.delete(1, 2), { code: "CONFLICT" });
  await assert.rejects(
    service.update(1, { role: "operador" }, 2),
    { code: "CONFLICT" }
  );
});

test("serializes simultaneous admin removals so at least one admin remains", async () => {
  const { service, users } = serviceFor([makeUser(1, "admin"), makeUser(2, "admin")]);

  const outcomes = await Promise.allSettled([
    service.delete(2, 1),
    service.update(1, { role: "supervisor" }, 2),
  ]);

  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  assert.equal([...users.values()].filter((user) => user.role === "admin").length, 1);
});

test("rejects deletion while the user is linked to tasks", async () => {
  const { service } = serviceFor(
    [makeUser(1, "cliente"), makeUser(2, "admin")],
    { 1: { client: 1, employee: 0 } }
  );

  await assert.rejects(service.delete(1, 2), { code: "CONFLICT" });
});

test("rejects role changes that conflict with task assignment roles", async () => {
  const { service } = serviceFor(
    [makeUser(1, "operador"), makeUser(2, "admin")],
    { 1: { client: 0, employee: 1 } }
  );

  await assert.rejects(
    service.update(1, { role: "cliente" }, 2),
    { code: "CONFLICT" }
  );
});

test("administrative password must contain at least 8 UTF-8 bytes", async () => {
  const { service } = serviceFor();

  await assert.rejects(
    service.create({
      nombre: "Nueva cuenta",
      email: "short@example.invalid",
      password: "1234567",
      role: "cliente",
    }),
    { code: "BAD_REQUEST" }
  );

  const created = await service.create({
    nombre: "Nueva cuenta",
    email: "eight@example.invalid",
    password: "12345678",
    role: "cliente",
  });
  assert.equal(created.role, "cliente");
});

test("administrative password must not exceed 72 UTF-8 bytes", async () => {
  const { service } = serviceFor();

  const accepted = await service.create({
    nombre: "Límite válido",
    email: "72-bytes@example.invalid",
    password: "a".repeat(72),
    role: "cliente",
  });
  assert.equal(accepted.role, "cliente");

  await assert.rejects(
    service.create({
      nombre: "Límite inválido",
      email: "73-bytes@example.invalid",
      password: "a".repeat(73),
      role: "cliente",
    }),
    { code: "BAD_REQUEST" }
  );
});

test("measures multibyte passwords by UTF-8 bytes", async () => {
  const { service } = serviceFor();

  const accepted = await service.create({
    nombre: "Multibyte válido",
    email: "multibyte-valid@example.invalid",
    password: "é".repeat(36),
    role: "cliente",
  });
  assert.equal(accepted.role, "cliente");

  await assert.rejects(
    service.create({
      nombre: "Multibyte inválido",
      email: "multibyte-invalid@example.invalid",
      password: "é".repeat(37),
      role: "cliente",
    }),
    { code: "BAD_REQUEST" }
  );
});
