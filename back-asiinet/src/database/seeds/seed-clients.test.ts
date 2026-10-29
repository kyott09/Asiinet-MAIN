import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import { parseTaskCreateInput, type TaskInput } from "../../modules/task/task.controller.js";
import { createTaskService } from "../../modules/task/task.service.js";
import {
  buildClientSeedPlan,
  createSeededClientTasks,
  SEED_DEV_PASSWORD,
} from "./seed-clients.js";

const today = "2026-10-29";

test("genera 20 clientes y 50 solicitudes distribuidas sin repetir servicio por cliente", () => {
  const plan = buildClientSeedPlan(today);

  assert.equal(plan.clients.length, 20);
  assert.equal(plan.requests.length, 50);
  assert.deepEqual(
    Object.fromEntries(
      ["Instalación", "Reconexión", "Servicio técnico", "Desconexión"].map((service) => [
        service,
        plan.requests.filter(({ body }) => body.service === service).length,
      ])
    ),
    {
      "Instalación": 12,
      "Reconexión": 12,
      "Servicio técnico": 13,
      "Desconexión": 13,
    }
  );

  for (const client of plan.clients) {
    const clientRequests = plan.requests.filter(({ clientIndex }) => clientIndex === client.index);
    assert.ok(clientRequests.length >= 2 && clientRequests.length <= 3);
    assert.equal(new Set(clientRequests.map(({ body }) => body.service)).size, clientRequests.length);
  }
});

test("las 50 descripciones con marcador y detalles pasan el esquema Zod de cliente", () => {
  const plan = buildClientSeedPlan(today);

  for (const { body } of plan.requests) {
    assert.match(body.description, /^\[SEED-DEV\]/);
    assert.doesNotThrow(() => parseTaskCreateInput(body, "cliente"));
  }
});

test("crea las 50 solicitudes mediante el servicio y persiste dueDate null", async () => {
  const plan = buildClientSeedPlan(today);
  const users = new Map<number, any>(
    plan.clients.map((client, index) => [index + 1, {
      id: index + 1,
      email: client.email,
      nombre: client.nombre,
      role: "cliente",
    }])
  );
  const tasks = new Map<number, any>();
  const writes: any[] = [];
  let nextId = 1;
  const service = createTaskService({
    tasks: {
      findAll: async () => [...tasks.values()],
      findById: async (id: number) => tasks.get(id) ?? null,
      create: async (data: any) => {
        const task = { ...structuredClone(data), id: nextId++ };
        tasks.set(task.id, task);
        writes.push(structuredClone(task));
        return task;
      },
      save: async (task: any) => task,
      remove: async () => undefined,
    },
    users: {
      findById: async (id: number) => users.get(id) ?? null,
      findByRoles: async () => [],
    },
    today: () => today,
  });

  await createSeededClientTasks(plan, users, service);

  assert.equal(writes.length, 50);
  assert.ok(writes.every((task) => task.dueDate === null));
  assert.ok(writes.every((task) => task.employeeId === null));
  assert.ok(writes.every((task) => task.status === "Vista" && task.priority === "Baja"));
});

test("la contraseña fija satisface el mínimo del formulario y se hashea como en el registro", async () => {
  assert.ok(SEED_DEV_PASSWORD.length >= 6);
  const hash = await bcrypt.hash(SEED_DEV_PASSWORD, 10);
  assert.equal(await bcrypt.compare(SEED_DEV_PASSWORD, hash), true);
  assert.notEqual(hash, SEED_DEV_PASSWORD);
});
