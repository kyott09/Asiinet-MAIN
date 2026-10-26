import test from "node:test";
import assert from "node:assert/strict";

import { parseTaskCreateInput, parseTaskUpdateInput, type TaskInput } from "./task.controller.js";
import { buildTaskPayload } from "../../../../shared/taskPayload.js";

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
  );

  assert.equal(payload.service, "Instalación");
  assert.equal(payload.description, "Necesito internet en casa");
  assert.ok("status" in payload);
  assert.equal(payload.status, "Vista");
  assert.equal("dueDate" in payload, false);
  assert.equal("priority" in payload, false);
  assert.equal("employeeId" in payload, false);
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
      dueDate: "2026-10-26",
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

test("la actualización administrativa conserva la normalización de prioridad y estado", () => {
  const payload = parseTaskUpdateInput({
    clientId: "1",
    employeeId: "2",
    dueDate: "2026-10-27",
    description: "Tarea actualizada",
    service: "Instalación",
    priority: " alta ",
    status: " finalizado ",
    serviceDetails: installationDetails,
  }, "admin") as TaskInput;

  assert.equal(payload.priority, "Alta");
  assert.equal(payload.status, "Terminada");
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
          dueDate: "2026-10-26",
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
      dueDate: "2026-10-26",
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
    () => parseTaskUpdateInput({ dueDate: "2026-10-26", status: "En proceso", serviceDetails: installationDetails }, "operador"),
    { code: "BAD_REQUEST" }
  );
  assert.throws(
    () => parseTaskUpdateInput({
      clientId: "1",
      employeeId: "2",
      dueDate: "2026-10-26",
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
      dueDate: "2026-10-26",
      description: "Tarea",
      service: "Instalación",
      serviceDetails: installationDetails,
    }, "operador"),
    { code: "BAD_REQUEST" }
  );
  assert.throws(
    () => parseTaskUpdateInput({ dueDate: "2026-10-26", status: "En proceso", serviceDetails: installationDetails }, "operador"),
    { code: "BAD_REQUEST" }
  );
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

test("los payloads reales de TaskForm usan una lista explícita de claves por rol", () => {
  const form = {
    clientId: "1",
    employeeId: "2",
    dueDate: "2026-10-26",
    description: "Trabajo solicitado",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: installationDetails,
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
  assert.deepEqual(Object.keys(clientCreate).sort(), ["description", "service", "serviceDetails"]);
  assert.deepEqual(Object.keys(clientUpdate), ["description"]);
  assert.deepEqual(Object.keys(adminCreate).sort(), [
    "clientId", "description", "dueDate", "employeeId", "priority", "service", "serviceDetails", "status",
  ]);
  assert.deepEqual(Object.keys(supervisorUpdate).sort(), Object.keys(adminCreate).sort());

  assert.deepEqual(parseTaskCreateInput(clientCreate, "cliente").serviceDetails, installationDetails);
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
