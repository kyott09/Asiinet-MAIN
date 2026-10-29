import test from "node:test";
import assert from "node:assert/strict";

import { parseTaskCreateInput, parseTaskUpdateInput, type TaskInput } from "./task.controller.js";
import { buildTaskPayload } from "../../../../shared/taskPayload.js";
import { TASK_VISIT_TIME_SLOTS } from "../../../../shared/taskVisitSlots.js";
import { getBuenosAiresDateOffset } from "./task.test-helpers.js";

const futureDueDate = getBuenosAiresDateOffset(30);
const futureVisitDate = getBuenosAiresDateOffset(1);

const installationDetails = {
  equipment: [
    { type: "modem", quantity: 1 },
    { type: "router", quantity: 1 },
  ],
  speed: "300",
  propertyType: "casa",
};

const validServiceDetails = {
  "Instalación": installationDetails,
  "Reconexión": {
    reason: "mudanza",
    availableEquipment: ["modem", "router"],
  },
  "Servicio técnico": {
    problem: "conexion_lenta",
    affectedEquipment: ["router"],
  },
  "Desconexión": {
    reason: "mudanza",
    equipmentReturn: "si",
  },
};

test("cliente can create a request with only service and description", () => {
  const payload = parseTaskCreateInput(
    {
      service: "Instalación",
      description: "Necesito internet en casa",
    },
    "cliente"
  ) as TaskInput;

  assert.equal(payload.service, "Instalación");
  assert.equal(payload.description, "Necesito internet en casa");
  assert.ok("status" in payload);
  assert.equal(payload.status, "Vista");
  assert.equal("dueDate" in payload, false);
  assert.equal("priority" in payload, false);
  assert.equal("employeeId" in payload, false);
  assert.equal(payload.visitDate, null);
  assert.equal(payload.visitTimeSlot, null);
});

test("cliente puede crear con cada franja compartida o sin visita", () => {
  const date = getBuenosAiresDateOffset(1);
  for (const { value } of TASK_VISIT_TIME_SLOTS) {
    const payload = parseTaskCreateInput({
      service: "Instalación",
      description: "Solicitud del cliente",
      visitDate: date,
      visitTimeSlot: value,
    }, "cliente") as TaskInput;

    assert.equal(payload.visitDate, date);
    assert.equal(payload.visitTimeSlot, value);
  }

  const withoutVisit = parseTaskCreateInput({
    service: "Instalación",
    description: "Solicitud sin coordinar",
  }, "cliente") as TaskInput;
  assert.equal(withoutVisit.visitDate, null);
  assert.equal(withoutVisit.visitTimeSlot, null);
});

test("cliente no puede crear una visita con una sola clave", () => {
  for (const visitFields of [
    { visitDate: getBuenosAiresDateOffset(1) },
    { visitTimeSlot: "manana" },
  ]) {
    assert.throws(
      () => parseTaskCreateInput({
        service: "Instalación",
        description: "Solicitud incompleta",
        ...visitFields,
      }, "cliente"),
      { code: "BAD_REQUEST" }
    );
  }
});

test("cliente puede crear con detalles válidos del servicio de instalación", () => {
  const payload = parseTaskCreateInput(
    {
      service: "Instalación",
      description: "Necesito internet en casa",
      serviceDetails: installationDetails,
    },
    "cliente"
  );

  assert.deepEqual(payload.serviceDetails, installationDetails);
});

test("administración puede crear con detalles válidos del servicio seleccionado", () => {
  const payload = parseTaskCreateInput(
    {
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Instalación en domicilio",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
      serviceDetails: installationDetails,
    },
    "admin"
  );

  assert.deepEqual(payload.serviceDetails, installationDetails);
});

test("admin y supervisor aceptan dueDate ausente, nulo o vacío al crear sin asignar una fecha automática", () => {
  const taskFields = {
    clientId: "1",
    employeeId: "2",
    description: "Tarea sin fecha de finalización",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  };

  for (const role of ["admin", "supervisor"]) {
    for (const dueDate of [undefined, null, ""]) {
      const body = dueDate === undefined ? taskFields : { ...taskFields, dueDate };
      const payload = parseTaskCreateInput(body, role) as TaskInput;

      assert.equal(payload.dueDate, null, `${role}, dueDate=${String(dueDate)}`);
    }

    const datedPayload = parseTaskCreateInput({
      ...taskFields,
      dueDate: futureDueDate,
    }, role) as TaskInput;
    assert.equal(datedPayload.dueDate, futureDueDate, `${role}, fecha válida`);
  }
});

test("admin y supervisor pueden crear una visita con fecha y franja compartida", () => {
  for (const role of ["admin", "supervisor"]) {
    const payload = parseTaskCreateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Instalación en domicilio",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
      visitDate: futureVisitDate,
      visitTimeSlot: "noche",
    }, role) as TaskInput;

    assert.equal(payload.visitDate, futureVisitDate);
    assert.equal(payload.visitTimeSlot, "noche");
  }
});

test("el PUT del operador acepta actualizar estado sin fecha y normaliza una fecha vacía a null", () => {
  assert.deepEqual(parseTaskUpdateInput({ status: "Terminada" }, "operador"), {
    status: "Terminada",
  });
  assert.deepEqual(parseTaskUpdateInput({ dueDate: "", status: "Terminada" }, "operador"), {
    dueDate: null,
    status: "Terminada",
  });
  assert.deepEqual(parseTaskUpdateInput({ dueDate: null, status: "Terminada" }, "operador"), {
    dueDate: null,
    status: "Terminada",
  });
});

test("admin y supervisor aceptan dueDate ausente, nulo o vacío al editar", () => {
  const taskFields = {
    clientId: "1",
    employeeId: "2",
    description: "Tarea sin plazo",
    service: "Instalación",
    priority: "Media",
    status: "Terminada",
  };

  for (const role of ["admin", "supervisor"]) {
    for (const dueDate of [null, ""]) {
      const payload = parseTaskUpdateInput({ ...taskFields, dueDate }, role) as TaskInput;
      assert.equal(payload.dueDate, null, `${role}, dueDate=${String(dueDate)}`);
    }

    const withoutDate = parseTaskUpdateInput(taskFields, role) as TaskInput;
    assert.equal("dueDate" in withoutDate, false, `${role}, dueDate ausente`);
  }
});

test("los payloads de frontend mantienen las claves por rol y permiten crear o editar sin dueDate", () => {
  const form = {
    clientId: "1",
    employeeId: "2",
    dueDate: "",
    description: "Tarea sin fecha de finalización",
    service: "Instalación",
    priority: "Media",
    status: "Terminada",
    serviceDetails: null,
    visitDate: "",
    visitTimeSlot: "",
  };

  for (const role of ["admin", "supervisor"]) {
    const createPayload = buildTaskPayload({ role, editingId: null, form });
    const updatePayload = buildTaskPayload({ role, editingId: 10, form });
    assert.equal((parseTaskCreateInput(createPayload, role) as TaskInput).dueDate, null, `${role}: crear`);
    assert.equal((parseTaskUpdateInput(updatePayload, role) as TaskInput).dueDate, null, `${role}: editar`);
  }

  const operatorPayload = buildTaskPayload({ role: "operador", editingId: 10, form });
  assert.ok(operatorPayload);
  assert.deepEqual(Object.keys(operatorPayload).sort(), ["dueDate", "status"]);
  assert.equal((parseTaskUpdateInput(operatorPayload, "operador") as TaskInput).dueDate, null);
});

test("la actualización administrativa conserva la normalización de prioridad y estado", () => {
  const payload = parseTaskUpdateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Tarea actualizada",
    service: "Instalación",
    priority: " alta ",
    status: " finalizado ",
    serviceDetails: installationDetails,
  }, "admin") as TaskInput;

  assert.equal(payload.priority, "Alta");
  assert.equal(payload.status, "Terminada");
});

test("admin y supervisor aceptan visita completa, nula u omitida en una actualización", () => {
  const taskFields = {
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Tarea actualizada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  };
  const scheduled = parseTaskUpdateInput({
    ...taskFields,
    visitDate: futureVisitDate,
    visitTimeSlot: "manana",
  }, "admin") as TaskInput;
  const removed = parseTaskUpdateInput({
    ...taskFields,
    visitDate: null,
    visitTimeSlot: null,
  }, "supervisor") as TaskInput;
  const unchanged = parseTaskUpdateInput(taskFields, "admin") as TaskInput;

  assert.equal(scheduled.visitDate, futureVisitDate);
  assert.equal(scheduled.visitTimeSlot, "manana");
  assert.equal(removed.visitDate, null);
  assert.equal(removed.visitTimeSlot, null);
  assert.equal("visitDate" in unchanged, false);
  assert.equal("visitTimeSlot" in unchanged, false);
});

test("rechaza pares de visita incompletos", () => {
  const taskFields = {
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Tarea actualizada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
  };

  for (const visitFields of [
    { visitDate: "2026-10-31" },
    { visitTimeSlot: "manana" },
    { visitDate: null },
    { visitTimeSlot: null },
    { visitDate: "2026-10-31", visitTimeSlot: null },
    { visitDate: null, visitTimeSlot: "manana" },
  ]) {
    assert.throws(
      () => parseTaskUpdateInput({ ...taskFields, ...visitFields }, "admin"),
      { code: "BAD_REQUEST" },
      JSON.stringify(visitFields)
    );
  }
});

test("cliente conserva su PUT de solo descripción y operador no puede enviar una visita", () => {
  assert.deepEqual(parseTaskUpdateInput({ description: "Cambio" }, "cliente"), {
    description: "Cambio",
  });
  assert.throws(
    () => parseTaskUpdateInput({
      dueDate: futureDueDate,
      status: "En proceso",
      visitDate: "2026-10-31",
      visitTimeSlot: "manana",
    }, "operador"),
    { code: "BAD_REQUEST" }
  );
});

test("cliente no puede enviar visita ni detalles en un PUT", () => {
  for (const body of [
    { description: "Cambio", visitDate: "2026-10-31", visitTimeSlot: "manana" },
    { description: "Cambio", serviceDetails: installationDetails },
  ]) {
    assert.throws(
      () => parseTaskUpdateInput(body, "cliente"),
      { code: "BAD_REQUEST" }
    );
  }
});

test("administración admite employeeId nulo en actualizaciones sin asignación previa", () => {
  const payload = parseTaskUpdateInput({
    description: "Solicitud sin operador",
    service: "Instalación",
    status: "Vista",
    employeeId: null,
  }, "admin") as TaskInput;

  assert.equal(payload.employeeId, null);
});

test("el PUT administrativo sigue rechazando estados heredados cancelada y cancelado", () => {
  for (const status of ["cancelada", "cancelado"]) {
    assert.throws(
      () => parseTaskUpdateInput({
        description: "Actualizar estado heredado",
        service: "Instalación",
        status,
      }, "admin"),
      { code: "BAD_REQUEST" },
      status
    );
  }
});

test("cada servicio acepta solo su variante de detalles", () => {
  for (const [service, serviceDetails] of Object.entries(validServiceDetails)) {
    const payload = parseTaskCreateInput(
      { service, description: "Solicitud de prueba", serviceDetails },
      "cliente"
    );
    assert.deepEqual(payload.serviceDetails, serviceDetails, service);
  }
});

test("rechaza detalles de servicio incompatibles con el discriminante", () => {
  assert.throws(
    () => parseTaskCreateInput(
      {
        service: "Reconexión",
        description: "Reconexión solicitada",
        serviceDetails: installationDetails,
      },
      "cliente"
    ),
    { code: "BAD_REQUEST" }
  );
});

test("rechaza detalles inválidos, valores fuera de opciones y campos internos extra", () => {
  const invalidByService = [
    ["Instalación", { ...installationDetails, speed: "9999" }],
    ["Instalación", { ...installationDetails, propertyType: "hotel" }],
    ["Instalación", { ...installationDetails, equipment: [{ type: "modem", quantity: 0 }] }],
    ["Instalación", { ...installationDetails, equipment: [{ type: "modem", quantity: 1, extra: true }] }],
    ["Reconexión", { ...validServiceDetails["Reconexión"], reason: "inventado" }],
    ["Servicio técnico", { ...validServiceDetails["Servicio técnico"], problem: "cualquiera" }],
    ["Desconexión", { ...validServiceDetails["Desconexión"], equipmentReturn: "tal vez" }],
  ] as const;

  for (const [service, serviceDetails] of invalidByService) {
    assert.throws(
      () => parseTaskCreateInput({ service, description: "Solicitud inválida", serviceDetails }, "cliente"),
      { code: "BAD_REQUEST" },
      service
    );
  }
});

test("rechaza campos extra en creación de tareas por rol", () => {
  for (const role of ["cliente", "admin", "supervisor"]) {
    const body = role === "cliente"
      ? { service: "Instalación", description: "Solicitud válida", unexpected: true }
      : {
          clientId: "1",
          employeeId: "2",
          dueDate: futureDueDate,
          description: "Tarea válida",
          service: "Instalación",
          priority: "Baja",
          status: "Vista",
          unexpected: true,
        };

    assert.throws(() => parseTaskCreateInput(body, role), { code: "BAD_REQUEST" });
  }
});

test("los payloads antiguos sin detalles siguen siendo válidos y se normalizan a null", () => {
  const clientPayload = parseTaskCreateInput(
    { service: "Instalación", description: "Solicitud anterior" },
    "cliente"
  );
  const adminPayload = parseTaskCreateInput(
    {
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Tarea anterior",
      service: "Instalación",
      priority: "Baja",
      status: "Vista",
    },
    "admin"
  );

  assert.equal(clientPayload.serviceDetails, null);
  assert.equal(adminPayload.serviceDetails, null);
});

test("serviceDetails null se acepta para tareas antiguas", () => {
  const payload = parseTaskCreateInput(
    {
      service: "Instalación",
      description: "Solicitud antigua",
      serviceDetails: null,
    },
    "cliente"
  );

  assert.equal(payload.serviceDetails, null);
});

test("cliente y operador no pueden actualizar serviceDetails", () => {
  assert.throws(
    () => parseTaskUpdateInput({ description: "Cambio", serviceDetails: installationDetails }, "cliente"),
    { code: "BAD_REQUEST" }
  );
  assert.throws(
    () => parseTaskUpdateInput({ dueDate: futureDueDate, status: "En proceso", serviceDetails: installationDetails }, "operador"),
    { code: "BAD_REQUEST" }
  );
  assert.throws(
    () => parseTaskUpdateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Cambio de servicio",
      service: "Reconexión",
      priority: "Baja",
      status: "Vista",
      serviceDetails: installationDetails,
    }, "admin"),
    { code: "BAD_REQUEST" }
  );
});

test("operador no puede crear o editar detalles específicos a través de sus payloads", () => {
  assert.throws(
    () => parseTaskCreateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: futureDueDate,
      description: "Tarea",
      service: "Instalación",
      serviceDetails: installationDetails,
    }, "operador"),
    { code: "BAD_REQUEST" }
  );
  assert.throws(
    () => parseTaskUpdateInput({ dueDate: futureDueDate, status: "En proceso", serviceDetails: installationDetails }, "operador"),
    { code: "BAD_REQUEST" }
  );
});

test("operador can update an assigned task with only due date and status", () => {
  const payload = parseTaskUpdateInput(
    {
      dueDate: futureDueDate,
      status: "En proceso",
    },
    "operador"
  );

  assert.deepEqual(payload, {
    dueDate: futureDueDate,
    status: "En proceso",
  });
});

test("los payloads reales de TaskForm usan una lista explícita de claves por rol", () => {
  const form = {
    clientId: "1",
    employeeId: "2",
    dueDate: futureDueDate,
    description: "Trabajo solicitado",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: installationDetails,
    visitDate: "2026-10-31",
    visitTimeSlot: "manana",
    accidentalField: "no enviar",
  };

  const clientCreate = buildTaskPayload({ role: "cliente", editingId: null, form });
  const clientUpdate = buildTaskPayload({ role: "cliente", editingId: 10, form });
  const operatorUpdate = buildTaskPayload({ role: "operador", editingId: 10, form });
  const adminCreate = buildTaskPayload({ role: "admin", editingId: null, form });
  const supervisorUpdate = buildTaskPayload({ role: "supervisor", editingId: 10, form });

  if (!clientCreate || !clientUpdate || !operatorUpdate || !adminCreate || !supervisorUpdate) {
    throw new Error("Payload inesperado para el rol seleccionado");
  }
  assert.deepEqual(Object.keys(clientCreate).sort(), [
    "description", "service", "serviceDetails", "visitDate", "visitTimeSlot",
  ]);
  assert.equal(clientCreate.visitDate, form.visitDate);
  assert.equal(clientCreate.visitTimeSlot, form.visitTimeSlot);
  assert.deepEqual(Object.keys(clientUpdate), ["description"]);
  assert.deepEqual(Object.keys(adminCreate).sort(), [
    "clientId", "description", "dueDate", "employeeId", "priority", "service", "serviceDetails", "status", "visitDate", "visitTimeSlot",
  ]);
  assert.deepEqual(Object.keys(supervisorUpdate).sort(), Object.keys(adminCreate).sort());

  assert.deepEqual(parseTaskCreateInput(clientCreate, "cliente").serviceDetails, installationDetails);
  const parsedClientVisit = parseTaskCreateInput(clientCreate, "cliente") as TaskInput;
  assert.equal(parsedClientVisit.visitDate, form.visitDate);
  assert.equal(parsedClientVisit.visitTimeSlot, form.visitTimeSlot);
  assert.deepEqual(parseTaskCreateInput(adminCreate, "admin").serviceDetails, installationDetails);
  assert.deepEqual(parseTaskUpdateInput(clientUpdate, "cliente"), { description: form.description });
  assert.deepEqual(parseTaskUpdateInput(operatorUpdate, "operador"), {
    dueDate: form.dueDate,
    status: form.status,
  });
  assert.deepEqual((parseTaskUpdateInput(adminCreate, "admin") as TaskInput).serviceDetails, installationDetails);
  assert.deepEqual((parseTaskUpdateInput(supervisorUpdate, "supervisor") as TaskInput).serviceDetails, installationDetails);
  assert.equal("accidentalField" in adminCreate, false);
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
