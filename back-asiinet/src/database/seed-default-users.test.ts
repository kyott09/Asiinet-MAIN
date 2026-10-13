import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import type { User } from "../modules/user/user.entity.js";
import { ensureDefaultUsers } from "./seed-default-users.js";

test("creates two clients and two operators only once", async () => {
  const users = new Map<string, User>();
  const findUserByEmail = async (email: string) => users.get(email) ?? null;
  const saveUser = async (user: Partial<User>) => {
    const savedUser = {
      id: users.size + 1,
      nombre: "Usuario",
      email: "",
      passwordHash: "",
      role: "cliente",
      fechaNacimiento: null,
      domicilio: null,
      fotoPerfil: null,
      creadoEn: new Date(),
      ...user,
    } satisfies User;

    users.set(savedUser.email, savedUser);
    return savedUser;
  };

  await ensureDefaultUsers(findUserByEmail, saveUser, "123456");

  assert.equal(users.size, 4);
  assert.equal(users.get("cliente1@asiinet.com")?.role, "cliente");
  assert.equal(users.get("cliente2@asiinet.com")?.role, "cliente");
  assert.equal(users.get("empleado1@asiinet.com")?.role, "operador");
  assert.equal(users.get("empleado2@asiinet.com")?.role, "operador");

  const clientPasswordHash = users.get("cliente1@asiinet.com")?.passwordHash;
  assert.ok(clientPasswordHash);
  assert.equal(await bcrypt.compare("123456", clientPasswordHash), true);

  await ensureDefaultUsers(findUserByEmail, saveUser, "123456");
  assert.equal(users.size, 4);
});

test("repairs demo account roles without resetting existing passwords", async () => {
  const users = new Map<string, User>();
  const existingUser = {
    id: 1,
    nombre: "Cliente de prueba 1",
    email: "cliente1@asiinet.com",
    passwordHash: "existing-password-hash",
    role: "admin",
    fechaNacimiento: null,
    domicilio: null,
    fotoPerfil: null,
    creadoEn: new Date(),
  } satisfies User;
  users.set(existingUser.email, existingUser);

  const findUserByEmail = async (email: string) => users.get(email) ?? null;
  const saveUser = async (user: Partial<User>) => {
    const savedUser = { ...users.get(user.email ?? "")!, ...user } satisfies User;
    users.set(savedUser.email, savedUser);
    return savedUser;
  };

  await ensureDefaultUsers(findUserByEmail, saveUser, "123456");

  assert.equal(users.get(existingUser.email)?.role, "cliente");
  assert.equal(users.get(existingUser.email)?.passwordHash, "existing-password-hash");
  assert.equal(users.size, 4);
});
