import test from "node:test";
import assert from "node:assert/strict";

import {
  formatUserDate,
  normalizeRegistrationRole,
  parseDateOnlyToDate,
  toPublicUser,
} from "./user.service.js";
import type { User } from "./user.entity.js";

test("formatUserDate normalizes valid date values", () => {
  assert.equal(formatUserDate(new Date(2024, 4, 20)), "2024-05-20");
  assert.equal(formatUserDate("2024-05-20"), "2024-05-20");
  assert.equal(formatUserDate(""), null);
  assert.equal(formatUserDate(null), null);
  assert.equal(formatUserDate(undefined), null);
});

test("parseDateOnlyToDate preserves the chosen calendar day without timezone drift", () => {
  const parsed = parseDateOnlyToDate("2024-05-20");
  assert.ok(parsed);
  assert.equal(parsed.getFullYear(), 2024);
  assert.equal(parsed.getMonth(), 4);
  assert.equal(parsed.getDate(), 20);
  assert.equal(formatUserDate(parsed), "2024-05-20");
});

test("internal registration keeps privileged roles available", () => {
  assert.equal(normalizeRegistrationRole("admin"), "admin");
  assert.equal(normalizeRegistrationRole("operador"), "operador");
});

test("public user serialization excludes passwordHash", () => {
  const createdUser = {
    id: 1,
    nombre: "Usuario",
    email: "safe-response@example.invalid",
    passwordHash: "must-not-be-returned",
    role: "cliente",
    fechaNacimiento: null,
    domicilio: null,
    fotoPerfil: null,
    creadoEn: new Date(),
  } satisfies User;

  const publicUser = toPublicUser(createdUser);

  assert.equal("passwordHash" in publicUser, false);
  assert.equal(publicUser.role, "cliente");
});
