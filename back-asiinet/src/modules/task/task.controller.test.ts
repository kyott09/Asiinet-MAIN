import test from "node:test";
import assert from "node:assert/strict";

import { parseTaskCreateInput, parseTaskUpdateInput } from "./task.controller.js";

test("cliente can create a request with only service and description", () => {
  const payload = parseTaskCreateInput(
    {
      service: "Instalación",
      description: "Necesito internet en casa",
    },
    "cliente"
  );

  assert.equal(payload.service, "Instalación");
  assert.equal(payload.description, "Necesito internet en casa");
  assert.ok("status" in payload);
  assert.equal(payload.status, "Vista");
  assert.equal("dueDate" in payload, false);
  assert.equal("priority" in payload, false);
  assert.equal("employeeId" in payload, false);
});

test("operador can update an assigned task with only due date and status", () => {
  const payload = parseTaskUpdateInput(
    {
      dueDate: "2026-10-06",
      status: "En proceso",
    },
    "operador"
  );

  assert.deepEqual(payload, {
    dueDate: "2026-10-06",
    status: "En proceso",
  });
});

test("cliente can update a request with only its description", () => {
  const payload = parseTaskUpdateInput(
    {
      description: "Necesito reprogramar la visita",
    },
    "cliente"
  );

  assert.deepEqual(payload, {
    description: "Necesito reprogramar la visita",
  });
});
