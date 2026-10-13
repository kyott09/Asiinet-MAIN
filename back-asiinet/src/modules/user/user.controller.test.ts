import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { createRegisterHandler } from "./user.controller.js";
import * as userService from "./user.service.js";

const submitRegistration = async (body: Record<string, unknown>) => {
  let createdRole = "";
  const registerUser: typeof userService.register = async (
    email,
    _password,
    role = "cliente",
    nombre
  ) => {
    createdRole = role;
    return {
      id: 1,
      nombre: nombre ?? "Usuario",
      email,
      role,
      fechaNacimiento: null,
      domicilio: null,
      fotoPerfil: null,
    };
  };

  const response = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  await createRegisterHandler(registerUser)(
    { body } as Request,
    response as unknown as Response
  );

  return { createdRole, response };
};

test("public registration ignores an admin role from the request", async () => {
  const { createdRole, response } = await submitRegistration({
    email: "admin-role@example.invalid",
    password: "password",
    nombre: "Registro público",
    role: "admin",
  });

  assert.equal(createdRole, "cliente");
  assert.equal(response.statusCode, 201);
  assert.equal((response.body as { role: string }).role, "cliente");
});

test("public registration ignores a supervisor role from the request", async () => {
  const { createdRole, response } = await submitRegistration({
    email: "supervisor@example.invalid",
    password: "password",
    nombre: "Registro público",
    role: "supervisor",
  });

  assert.equal(createdRole, "cliente");
  assert.equal((response.body as { role: string }).role, "cliente");
});

test("public registration ignores an operator role from the request", async () => {
  const { createdRole, response } = await submitRegistration({
    email: "operador@example.invalid",
    password: "password",
    nombre: "Registro público",
    role: "operador",
  });

  assert.equal(createdRole, "cliente");
  assert.equal((response.body as { role: string }).role, "cliente");
});

test("public registration accepts the frontend user role as a client", async () => {
  const { createdRole, response } = await submitRegistration({
    email: "frontend-role@example.invalid",
    password: "password",
    nombre: "Registro público",
    role: "user",
  });

  assert.equal(createdRole, "cliente");
  assert.equal((response.body as { role: string }).role, "cliente");
});

test("public registration defaults to a client when role is omitted", async () => {
  const { createdRole, response } = await submitRegistration({
    email: "default-role@example.invalid",
    password: "password",
    nombre: "Registro público",
  });

  assert.equal(createdRole, "cliente");
  assert.equal((response.body as { role: string }).role, "cliente");
});

test("registration response does not include a password hash", async () => {
  const { response } = await submitRegistration({
    email: "safe-response@example.invalid",
    password: "password",
    role: "user",
  });

  assert.equal("passwordHash" in (response.body as object), false);
});
