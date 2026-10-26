import assert from "node:assert/strict";
import test from "node:test";
import { createTaskService } from "./task.service.js";

const users = new Map<number, any>([
  [1, { id: 1, nombre: "Cliente", email: "cliente@example.invalid", role: "cliente" }],
  [2, { id: 2, nombre: "Operador", email: "operador@example.invalid", role: "operador" }],
]);

const installationDetails = {
  equipment: [{ type: "modem", quantity: 1 }],
  speed: "300",
  propertyType: "casa",
};

function serviceFor(initialTasks: any[] = []) {
  const tasks = new Map<number, any>(initialTasks.map((task) => [task.id, { ...task }]));
  let nextId = Math.max(0, ...tasks.keys()) + 1;
  const service = createTaskService({
    tasks: {
      findAll: async () => [...tasks.values()],
      findById: async (id: number) => tasks.get(id) ?? null,
      create: async (data: any) => {
        const task = { ...data, id: nextId++ };
        tasks.set(task.id, task);
        return task;
      },
      save: async (task: any) => {
        tasks.set(task.id, task);
        return task;
      },
      remove: async (task: any) => tasks.delete(task.id),
    },
    users: {
      findById: async (id: number) => users.get(id) ?? null,
      findByRoles: async () => [users.get(2)!],
    },
  } as any);

  return { service, tasks };
}

test("al crear como cliente, el serviceDetails guardado pertenece al actor de sesión", async () => {
  const { service, tasks } = serviceFor();
  const created = await service.create({
    clientId: 999,
    service: "Instalación",
    description: "Alta domiciliaria",
    serviceDetails: installationDetails,
  }, { id: 1, role: "cliente" });

  const stored = tasks.get(created.id);
  assert.equal(stored.clientId, 1);
  assert.deepEqual(stored.serviceDetails, installationDetails);
});

test("admin puede guardar detalles previamente validados en la tarea asignada", async () => {
  const { service, tasks } = serviceFor();
  const created = await service.create({
    clientId: 1,
    employeeId: 2,
    dueDate: "2026-10-27",
    description: "Instalación solicitada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: installationDetails,
  }, { id: 9, role: "admin" });

  assert.equal(tasks.get(created.id).clientId, 1);
  assert.deepEqual(tasks.get(created.id).serviceDetails, installationDetails);
});

test("al cambiar de servicio sin detalles nuevos, elimina los detalles incompatibles", async () => {
  const existing = {
    id: 10,
    client: "Cliente",
    clientId: 1,
    employee: "Operador",
    employeeId: 2,
    clientUser: users.get(1),
    employeeUser: users.get(2),
    createdAt: "2026-10-20",
    dueDate: "2026-10-26",
    description: "Instalación domiciliaria",
    service: "Instalación",
    serviceDetails: installationDetails,
    priority: "Media",
    status: "Vista",
  };
  const { service, tasks } = serviceFor([existing]);

  await service.update(10, {
    clientId: 1,
    employeeId: 2,
    dueDate: "2026-10-26",
    description: "Reconexión solicitada",
    service: "Reconexión",
    priority: "Media",
    status: "Vista",
  }, { id: 3, role: "admin" });

  assert.equal(tasks.get(10).service, "Reconexión");
  assert.equal(tasks.get(10).serviceDetails, null);
});

test("actualizar una tarea sin cambiar el servicio conserva sus detalles", async () => {
  const existing = {
    id: 11,
    client: "Cliente",
    clientId: 1,
    employee: "Operador",
    employeeId: 2,
    clientUser: users.get(1),
    employeeUser: users.get(2),
    createdAt: "2026-10-20",
    dueDate: "2026-10-26",
    description: "Instalación domiciliaria",
    service: "Instalación",
    serviceDetails: installationDetails,
    priority: "Media",
    status: "Vista",
  };
  const { service, tasks } = serviceFor([existing]);

  await service.update(11, {
    clientId: 1,
    employeeId: 2,
    dueDate: "2026-10-26",
    description: "Descripción corregida",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  }, { id: 3, role: "supervisor" });

  assert.deepEqual(tasks.get(11).serviceDetails, installationDetails);
});

test("tareas existentes sin serviceDetails se serializan como null", async () => {
  const legacy = {
    id: 12,
    client: "Cliente",
    clientId: 1,
    employee: "Operador",
    employeeId: 2,
    clientUser: users.get(1),
    employeeUser: users.get(2),
    createdAt: "2026-10-20",
    dueDate: "2026-10-26",
    description: "Tarea anterior al campo nuevo",
    service: "Instalación",
    priority: "Baja",
    status: "Vista",
  };
  const { service } = serviceFor([legacy]);
  const result = await service.getAll({ id: 3, role: "admin" });

  assert.equal(result[0].serviceDetails, null);
});