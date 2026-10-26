import assert from "node:assert/strict";
import test from "node:test";
import { buildUserUpdatePayload } from "./userManagementPayload.js";

test("la edición de usuario no envía la contraseña vacía", () => {
  const form = {
    nombre: "Operador actualizado",
    email: "operador@example.invalid",
    password: "",
    role: "operador",
  };

  assert.deepEqual(buildUserUpdatePayload(form), {
    nombre: "Operador actualizado",
    email: "operador@example.invalid",
    role: "operador",
  });
});
