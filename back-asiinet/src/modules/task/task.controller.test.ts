import test from "node:test";
import assert from "node:assert/strict";

import { parseTaskCreateInput } from "./task.controller.js";

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
  assert.equal(payload.status, "Vista");
  assert.equal("dueDate" in payload, false);
  assert.equal("priority" in payload, false);
  assert.equal("employeeId" in payload, false);
});
