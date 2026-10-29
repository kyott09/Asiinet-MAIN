import assert from "node:assert/strict";
import test from "node:test";
import { parseTaskCreateInput, parseTaskUpdateInput, type TaskInput } from "./task.controller.js";
import { createTaskService } from "./task.service.js";
import { getBuenosAiresDateOffset } from "./task.test-helpers.js";

const serviceToday = getBuenosAiresDateOffset(0);
const futureDueDate = getBuenosAiresDateOffset(30);
const futureVisitDate = getBuenosAiresDateOffset(2);

const users = new Map<number, any>([
  [1, { id: 1, nombre: "Cliente", email: "cliente@example.invalid", role: "cliente" }],
  [2, { id: 2, nombre: "Operador", email: "operador@example.invalid", role: "operador" }],
]);

const installationDetails = {
  equipment: [{ type: "modem", quantity: 1 }],
  speed: "300",
  propertyType: "casa",
};

function existingTask(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    client: "Cliente",
    clientId: 1,
    employee: "Operador",
    employeeId: 2,
    clientUser: users.get(1),
    employeeUser: users.get(2),
    createdAt: serviceToday,
    dueDate: futureDueDate,
    description: "Instalación domiciliaria",
    service: "Instalación",
    serviceDetails: installationDetails,
    priority: "Media",
    status: "Vista",
    visitDate: futureVisitDate,
    visitTimeSlot: "manana",
    ...overrides,
  };
}

function administrativeUpdate(overrides: Record<string, unknown> = {}) {
  return parseTaskUpdateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Descripción actualizada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    ...overrides,
  }, "admin") as TaskInput;
}

function serviceFor(initialTasks: any[] = [], todayProvider = () => serviceToday) {
  const tasks = new Map<number, any>(initialTasks.map((task) => [task.id, { ...task }]));
  const writes: any[] = [];
  let nextId = Math.max(0, ...tasks.keys()) + 1;
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
      save: async (task: any) => {
        const saved = structuredClone(task);
        tasks.set(task.id, saved);
        writes.push(saved);
        return saved;
      },
      remove: async (task: any) => tasks.delete(task.id),
    },
    users: {
      findById: async (id: number) => users.get(id) ?? null,
      findByRoles: async () => [users.get(2)!],
    },
    today: todayProvider,
  } as any);

  return { service, tasks, writes };
}

test("el esquema, el servicio y el repositorio simulado conservan serviceDetails al crear y editar", async () => {
  const { service, writes } = serviceFor();
  const actor = { id: 9, role: "admin" };
  const createInput = parseTaskCreateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Instalación solicitada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: installationDetails,
  }, actor.role) as TaskInput;

  const created = await service.create(createInput, actor);
  assert.deepEqual(writes[0].serviceDetails, installationDetails);

  const updateInput = parseTaskUpdateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Descripción actualizada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: installationDetails,
  }, actor.role) as TaskInput;
  await service.update(created.id, updateInput, actor);

  assert.deepEqual(writes[1].serviceDetails, installationDetails);
});

test("PUT administrativo sin campos de visita conserva fecha y franja existentes", async () => {
  const { service, tasks } = serviceFor([existingTask(20)]);
  await service.update(20, administrativeUpdate(), { id: 9, role: "admin" });

  assert.equal(tasks.get(20).visitDate, futureVisitDate);
  assert.equal(tasks.get(20).visitTimeSlot, "manana");
});

test("crear una tarea administrativa guarda y serializa la visita asignada", async () => {
  const { service, writes } = serviceFor();
  const input = parseTaskCreateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Instalación con visita",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    visitDate: futureVisitDate,
    visitTimeSlot: "noche",
  }, "supervisor") as TaskInput;

  const created = await service.create(input, { id: 8, role: "supervisor" });

  assert.equal(writes[0].visitDate, futureVisitDate);
  assert.equal(writes[0].visitTimeSlot, "noche");
  assert.equal(created.visitDate, futureVisitDate);
  assert.equal(created.visitTimeSlot, "noche");
});

test("admin y supervisor guardan dueDate nulo cuando crean sin fecha o con el campo vacío", async () => {
  for (const role of ["admin", "supervisor"]) {
    for (const dueDate of [undefined, null, ""]) {
      const { service, writes } = serviceFor();
      const body = {
        clientId: "1",
        employeeId: "2",
        description: "Tarea sin plazo",
        service: "Instalación",
        priority: "Media",
        status: "Terminada",
        ...(dueDate === undefined ? {} : { dueDate }),
      };
      const input = parseTaskCreateInput(body, role) as TaskInput;

      await service.create(input, { id: 8, role });

      assert.equal(writes[0].dueDate, null, `${role}, dueDate=${String(dueDate)}`);
    }
  }
});

test("admin y supervisor pueden crear con fecha válida y rechazan una fecha anterior a createdAt", async () => {
  for (const role of ["admin", "supervisor"]) {
    const { service, writes } = serviceFor();
    const validInput = parseTaskCreateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Tarea con plazo",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
    }, role) as TaskInput;

    await service.create(validInput, { id: 8, role });
    assert.equal(writes[0].dueDate, futureDueDate);

    const previousDate = getBuenosAiresDateOffset(-1);
    const invalidInput = parseTaskCreateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: previousDate,
      description: "Tarea con plazo anterior",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
    }, role) as TaskInput;

    await assert.rejects(
      service.create(invalidInput, { id: 8, role }),
      {
        code: "BAD_REQUEST",
        message: "La fecha de finalización no puede ser anterior a la fecha de creación.",
      }
    );
  }
});

test("PUT administrativo con ambos campos nulos quita la visita", async () => {
  const { service, tasks } = serviceFor([existingTask(21)]);
  await service.update(21, administrativeUpdate({
    visitDate: null,
    visitTimeSlot: null,
  }), { id: 9, role: "admin" });

  assert.equal(tasks.get(21).visitDate, null);
  assert.equal(tasks.get(21).visitTimeSlot, null);
});

test("PUT administrativo con ambos campos completos asigna o reprograma la visita", async () => {
  const { service, tasks } = serviceFor([existingTask(22)]);
  await service.update(22, administrativeUpdate({
    visitDate: futureVisitDate,
    visitTimeSlot: "tarde",
  }), { id: 8, role: "supervisor" });

  assert.equal(tasks.get(22).visitDate, futureVisitDate);
  assert.equal(tasks.get(22).visitTimeSlot, "tarde");
});

test("admin y supervisor pueden cambiar detalles y visita en cualquier estado", async () => {
  const visitChanges = [
    {
      existingVisit: { visitDate: null, visitTimeSlot: null },
      requestedVisit: { visitDate: futureVisitDate, visitTimeSlot: "tarde" },
      action: "asignar",
    },
    {
      existingVisit: { visitDate: futureVisitDate, visitTimeSlot: "manana" },
      requestedVisit: { visitDate: futureVisitDate, visitTimeSlot: "tarde" },
      action: "reprogramar",
    },
    {
      existingVisit: { visitDate: futureVisitDate, visitTimeSlot: "manana" },
      requestedVisit: { visitDate: null, visitTimeSlot: null },
      action: "quitar",
    },
  ];

  for (const role of ["admin", "supervisor"]) {
    for (const status of ["Vista", "En proceso", "Terminada", "No terminada"]) {
      for (const { existingVisit, requestedVisit, action } of visitChanges) {
        const { service, tasks } = serviceFor([existingTask(23, { status, ...existingVisit })]);
        await service.update(23, administrativeUpdate({
          ...requestedVisit,
          serviceDetails: installationDetails,
          status,
        }), { id: 9, role });

        assert.deepEqual(tasks.get(23).serviceDetails, installationDetails, `${role}, ${status}: detalles`);
        assert.equal(tasks.get(23).status, status, `${role}, ${status}: estado preservado`);
        assert.equal(tasks.get(23).visitDate, requestedVisit.visitDate, `${role}, ${status}: ${action}`);
        assert.equal(tasks.get(23).visitTimeSlot, requestedVisit.visitTimeSlot, `${role}, ${status}: ${action}`);
      }
    }
  }
});

test("admin y supervisor pueden editar una tarea sin operador si queda en Vista", async () => {
  for (const role of ["admin", "supervisor"]) {
    for (const changes of [
      { description: "Descripción actualizada" },
      { serviceDetails: installationDetails },
      { visitDate: futureVisitDate, visitTimeSlot: "tarde" },
    ]) {
      const { service, tasks } = serviceFor([
        existingTask(25, { employee: null, employeeId: null, employeeUser: null }),
      ]);
      const input = parseTaskUpdateInput({
        description: changes.description ?? "Instalación domiciliaria",
        service: "Instalación",
        status: "Vista",
        ...changes,
      }, role);

      await service.update(25, input, { id: 9, role });
      assert.equal(tasks.get(25).employeeId, null);
      assert.equal(tasks.get(25).status, "Vista");
      if (changes.serviceDetails) assert.deepEqual(tasks.get(25).serviceDetails, installationDetails);
      if (changes.visitDate) {
        assert.equal(tasks.get(25).visitDate, changes.visitDate);
        assert.equal(tasks.get(25).visitTimeSlot, changes.visitTimeSlot);
      }
      if (changes.description) assert.equal(tasks.get(25).description, changes.description);
    }
  }
});

test("una tarea sin operador no puede pasar a un estado que requiere asignación", async () => {
  for (const role of ["admin", "supervisor"]) {
    const { service } = serviceFor([
      existingTask(25, { employee: null, employeeId: null, employeeUser: null }),
    ]);

    await assert.rejects(
      service.update(25, parseTaskUpdateInput({
        description: "Descripción actualizada",
        service: "Instalación",
        status: "En proceso",
      }, role), { id: 9, role }),
      { code: "BAD_REQUEST", message: "Selecciona un operador registrado con rol operador." }
    );
  }
});

test("admin y supervisor limpian dueDate al editar sin fecha y mantienen la validación si se informa", async () => {
  for (const role of ["admin", "supervisor"]) {
    const { service, tasks } = serviceFor([existingTask(26)]);
    const input = parseTaskUpdateInput({
      clientId: "1",
      employeeId: "2",
      description: "Tarea sin plazo",
      service: "Instalación",
      priority: "Media",
      status: "Terminada",
    }, role);

    await service.update(26, input, { id: 9, role });
    assert.equal(tasks.get(26).dueDate, null, `${role}: sin fecha`);
    assert.equal(tasks.get(26).status, "Terminada", `${role}: estado final sin fecha`);
  }

  const { service } = serviceFor([existingTask(27)]);
  const beforeCreatedAt = parseTaskUpdateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: getBuenosAiresDateOffset(-1),
    description: "Fecha inválida",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  }, "admin");

  await assert.rejects(
    service.update(27, beforeCreatedAt, { id: 9, role: "admin" }),
    {
      code: "BAD_REQUEST",
      message: "La fecha de finalización no puede ser anterior a la fecha de creación.",
    }
  );
});

test("operador cambia el estado sin fecha y guarda dueDate null", async () => {
  const { service, tasks } = serviceFor([existingTask(28)]);
  const input = parseTaskUpdateInput({ status: "Terminada" }, "operador");

  await service.update(28, input, { id: 2, role: "operador" });

  assert.equal(tasks.get(28).status, "Terminada");
  assert.equal(tasks.get(28).dueDate, null);
});

test("una fecha existente continúa funcionando al editar y el operador puede cambiar el estado", async () => {
  const { service, tasks } = serviceFor([existingTask(29, { dueDate: null })]);
  const input = parseTaskUpdateInput({
    dueDate: futureDueDate,
    status: "En proceso",
  }, "operador");

  await service.update(29, input, { id: 2, role: "operador" });

  assert.equal(tasks.get(29).dueDate, futureDueDate);
  assert.equal(tasks.get(29).status, "En proceso");
});

test("una tarea existente con fecha mantiene la fecha informada al editar", async () => {
  const { service, tasks } = serviceFor([existingTask(30)]);
  const input = parseTaskUpdateInput({
    dueDate: futureDueDate,
    status: "Terminada",
  }, "operador");

  await service.update(30, input, { id: 2, role: "operador" });

  assert.equal(tasks.get(30).dueDate, futureDueDate);
  assert.equal(tasks.get(30).status, "Terminada");
});

test("no se puede quitar el operador de una tarea ya asignada", async () => {
  for (const role of ["admin", "supervisor"]) {
    const { service } = serviceFor([existingTask(25)]);

    await assert.rejects(
      service.update(25, parseTaskUpdateInput({
        description: "Descripción actualizada",
        service: "Instalación",
        status: "Vista",
        employeeId: null,
      }, role), { id: 9, role }),
      { code: "BAD_REQUEST" }
    );
  }
});

test("crear como administrador sin operador se rechaza", async () => {
  const { service } = serviceFor();
  const input = parseTaskCreateInput({
    clientId: "1",
    dueDate: futureDueDate,
    description: "Tarea sin operador",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  }, "admin") as TaskInput;

  await assert.rejects(
    service.create(input, { id: 9, role: "admin" }),
    { code: "BAD_REQUEST", message: "Selecciona un empleado para asignar la tarea." }
  );
});

test("el PUT sin cambio de visita conserva una visita pasada, y asignarla sí valida la fecha", async () => {
  const simulatedInstant = new Date("2026-10-30T01:00:00.000Z");
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(simulatedInstant);
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const simulatedToday = `${parts.year}-${parts.month}-${parts.day}`;
  assert.equal(parts.hour, "22");
  assert.equal(simulatedToday, "2026-10-29");

  const { service, tasks } = serviceFor(
    [existingTask(26, { visitDate: "2020-01-01", visitTimeSlot: "manana" })],
    () => simulatedToday
  );

  await service.update(26, parseTaskUpdateInput({
    description: "Solo cambia la descripción",
    service: "Instalación",
    status: "Vista",
  }, "admin"), { id: 9, role: "admin" });
  assert.equal(tasks.get(26).visitDate, "2020-01-01");

  await assert.rejects(
    service.update(26, parseTaskUpdateInput({
      description: "Reprogramación anterior a hoy",
      service: "Instalación",
      status: "Vista",
      visitDate: "2026-10-28",
      visitTimeSlot: "tarde",
    }, "admin"), { id: 9, role: "admin" }),
    { code: "BAD_REQUEST" }
  );
});

test("crear cliente sin visita conserva ambos campos como null", async () => {
  const { service, writes } = serviceFor();
  const input = parseTaskCreateInput({
    service: "Instalación",
    description: "Solicitud sin coordinar",
  }, "cliente");

  const created = await service.create(input, { id: 1, role: "cliente" });

  assert.equal(writes[0].visitDate, null);
  assert.equal(writes[0].visitTimeSlot, null);
  assert.equal(created.visitDate, null);
  assert.equal(created.visitTimeSlot, null);
});

test("crear cliente con cada franja guarda y serializa la visita opcional", async () => {
  for (const slot of ["manana", "tarde", "noche"]) {
    const { service, writes } = serviceFor();
    const input = parseTaskCreateInput({
      service: "Instalación",
      description: `Solicitud ${slot}`,
      visitDate: getBuenosAiresDateOffset(1),
      visitTimeSlot: slot,
    }, "cliente");

    const created = await service.create(input, { id: 1, role: "cliente" });

    assert.equal(writes[0].visitTimeSlot, slot);
    assert.equal(created.visitTimeSlot, slot);
    assert.equal(writes[0].visitDate, getBuenosAiresDateOffset(1));
  }
});

test("crear cliente rechaza fecha de visita anterior al día de Buenos Aires", async () => {
  const today = "2026-10-29";
  const { service } = serviceFor([], () => today);
  const input = parseTaskCreateInput({
    service: "Instalación",
    description: "Solicitud con fecha pasada",
    visitDate: "2026-10-28",
    visitTimeSlot: "manana",
  }, "cliente");

  await assert.rejects(
    service.create(input, { id: 1, role: "cliente" }),
    { code: "BAD_REQUEST" }
  );
});

test("today predeterminado del servicio usa la fecha de Buenos Aires", async (context) => {
  const simulatedInstant = new Date("2026-10-30T01:00:00.000Z");
  context.mock.timers.enable({ apis: ["Date"], now: simulatedInstant });

  const createService = () => createTaskService({
    tasks: {
      findAll: async () => [],
      findById: async () => null,
      create: async (data: any) => ({ ...structuredClone(data), id: 1 }),
      save: async (task: any) => task,
      remove: async (task: any) => task,
    },
    users: {
      findById: async (id: number) => users.get(id) ?? null,
      findByRoles: async () => [users.get(2)!],
    },
  });

  try {
    assert.equal(new Date().toISOString().slice(0, 10), "2026-10-30");
    const acceptedInput = parseTaskCreateInput({
      service: "Instalación",
      description: "Visita para hoy en Buenos Aires",
      visitDate: "2026-10-29",
      visitTimeSlot: "manana",
    }, "cliente");
    const accepted = await createService().create(acceptedInput as TaskInput, {
      id: 1,
      role: "cliente",
    });

    assert.equal(accepted.visitDate, "2026-10-29");

    const rejectedInput = parseTaskCreateInput({
      service: "Instalación",
      description: "Visita del día anterior",
      visitDate: "2026-10-28",
      visitTimeSlot: "manana",
    }, "cliente");

    await assert.rejects(
      createService().create(rejectedInput as TaskInput, { id: 1, role: "cliente" }),
      { statusCode: 400, code: "BAD_REQUEST" }
    );
  } finally {
    context.mock.timers.reset();
  }
});

test("visita fechada hoy a las 22:00 de Argentina se acepta al crear y editar", async (context) => {
  const simulatedInstant = new Date("2026-10-30T01:00:00.000Z");
  context.mock.timers.enable({ apis: ["Date"], now: simulatedInstant });
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(simulatedInstant);
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const simulatedToday = `${parts.year}-${parts.month}-${parts.day}`;

  assert.equal(parts.hour, "22");
  assert.equal(simulatedToday, "2026-10-29");
  assert.equal(new Date().toISOString().slice(0, 10), "2026-10-30");

  const creationCases = [
    { role: "cliente", actor: { id: 1, role: "cliente" }, body: {
      service: "Instalación",
      description: "Solicitud del cliente",
      visitDate: simulatedToday,
      visitTimeSlot: "manana",
    } },
    { role: "admin", actor: { id: 9, role: "admin" }, body: {
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Tarea administrativa",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
      visitDate: simulatedToday,
      visitTimeSlot: "manana",
    } },
  ];

  for (const { role, actor, body } of creationCases) {
    const { service, writes } = serviceFor([], () => simulatedToday);
    const input = parseTaskCreateInput(body, role);
    const created = await service.create(input as TaskInput, actor);

    assert.equal(writes[0].visitDate, simulatedToday, `${role}: fecha guardada`);
    assert.equal(created.visitDate, simulatedToday, `${role}: fecha serializada`);

    const previousDayInput = parseTaskCreateInput({
      ...body,
      visitDate: "2026-10-28",
    }, role);
    await assert.rejects(
      serviceFor([], () => simulatedToday).service.create(previousDayInput as TaskInput, actor),
      { statusCode: 400, code: "BAD_REQUEST" },
      `${role}: el día anterior debe rechazarse`
    );
  }

  for (const role of ["admin", "supervisor"]) {
    const { service, tasks } = serviceFor(
      [existingTask(27, { visitDate: null, visitTimeSlot: null })],
      () => simulatedToday
    );
    const updateInput = parseTaskUpdateInput({
      ...administrativeUpdate(),
      visitDate: simulatedToday,
      visitTimeSlot: "tarde",
    }, role) as TaskInput;

    await service.update(27, updateInput, { id: 9, role });
    assert.equal(tasks.get(27).visitDate, simulatedToday, `${role}: visita de hoy asignada`);

    const previousDayInput = parseTaskUpdateInput({
      ...administrativeUpdate(),
      visitDate: "2026-10-28",
      visitTimeSlot: "tarde",
    }, role) as TaskInput;
    await assert.rejects(
      serviceFor(
        [existingTask(27, { visitDate: null, visitTimeSlot: null })],
        () => simulatedToday
      ).service.update(27, previousDayInput, { id: 9, role }),
      { statusCode: 400, code: "BAD_REQUEST" },
      `${role}: el día anterior debe rechazarse`
    );
  }
});

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
    dueDate: futureDueDate,
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
    createdAt: serviceToday,
    dueDate: futureDueDate,
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
    dueDate: futureDueDate,
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
    createdAt: serviceToday,
    dueDate: futureDueDate,
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
    dueDate: futureDueDate,
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
    createdAt: serviceToday,
    dueDate: futureDueDate,
    description: "Tarea anterior al campo nuevo",
    service: "Instalación",
    priority: "Baja",
    status: "Vista",
  };
  const { service } = serviceFor([legacy]);
  const result = await service.getAll({ id: 3, role: "admin" });

  assert.equal(result[0].serviceDetails, null);
});
