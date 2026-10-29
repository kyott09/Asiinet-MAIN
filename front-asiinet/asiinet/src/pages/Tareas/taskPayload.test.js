import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskPayload } from "../../../../../shared/taskPayload.js";
import { getTaskServiceDetailEntries, validateTaskServiceDetails } from "../../../../../shared/taskServiceDetails.js";
import {
  formatTaskVisit,
  formatTaskVisitDate,
  NO_TASK_VISIT_LABEL,
  TASK_VISIT_TIME_SLOTS,
} from "../../../../../shared/taskVisitSlots.js";

function getBuenosAiresDateOffset(daysFromToday) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const date = new Date(Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day) + daysFromToday
  ));

  return date.toISOString().slice(0, 10);
}

const futureDueDate = getBuenosAiresDateOffset(30);

const serviceDetails = {
  equipment: [{ type: "modem", quantity: 1 }],
  speed: "300",
  propertyType: "casa",
};

const form = {
  clientId: "1",
  employeeId: "2",
  dueDate: futureDueDate,
  description: "Solicitud",
  service: "Instalación",
  priority: "Media",
  status: "Vista",
  serviceDetails,
  visitDate: "2026-10-31",
  visitTimeSlot: "manana",
  accidentalField: "no enviar",
};

test("cada rol envía solo las claves de su contrato de creación y edición", () => {
  const clientCreate = buildTaskPayload({ role: "cliente", editingId: null, form });
  const clientUpdate = buildTaskPayload({ role: "cliente", editingId: 4, form });
  const operatorCreate = buildTaskPayload({ role: "operador", editingId: null, form });
  const operatorUpdate = buildTaskPayload({ role: "operador", editingId: 4, form });
  const adminCreate = buildTaskPayload({ role: "admin", editingId: null, form });
  const supervisorUpdate = buildTaskPayload({ role: "supervisor", editingId: 4, form });

  assert.deepEqual(Object.keys(clientCreate).sort(), [
    "description", "service", "serviceDetails", "visitDate", "visitTimeSlot",
  ]);
  assert.equal(clientCreate.visitDate, form.visitDate);
  assert.equal(clientCreate.visitTimeSlot, form.visitTimeSlot);
  assert.deepEqual(Object.keys(clientUpdate), ["description"]);
  assert.equal(operatorCreate, null);
  assert.deepEqual(Object.keys(operatorUpdate).sort(), ["dueDate", "status"]);
  assert.deepEqual(Object.keys(adminCreate).sort(), [
    "clientId", "description", "dueDate", "employeeId", "priority", "service", "serviceDetails", "status", "visitDate", "visitTimeSlot",
  ]);
  assert.deepEqual(Object.keys(supervisorUpdate).sort(), Object.keys(adminCreate).sort());
  assert.equal("accidentalField" in adminCreate, false);
});

test("payload administrativo mantiene claves explícitas y employeeId nulo sin string vacío", () => {
  const payload = buildTaskPayload({
    role: "supervisor",
    editingId: 4,
    form: { ...form, employeeId: "" },
  });

  assert.equal(payload.employeeId, null);
  assert.deepEqual(Object.keys(payload).sort(), [
    "clientId", "description", "dueDate", "employeeId", "priority", "service", "serviceDetails", "status", "visitDate", "visitTimeSlot",
  ]);
});

test("las fechas de visita se presentan desde YYYY-MM-DD sin conversión a zona local", () => {
  assert.equal(formatTaskVisitDate("2026-10-31"), "31/10/2026");
});

test("las franjas y sus etiquetas se comparten entre frontend y backend", () => {
  assert.deepEqual(TASK_VISIT_TIME_SLOTS, [
    { value: "manana", label: "Mañana" },
    { value: "tarde", label: "Tarde" },
    { value: "noche", label: "Noche" },
  ]);
});

test("la etiqueta de visita no coordinada es compartida y se presenta como A coordinar", () => {
  assert.equal(NO_TASK_VISIT_LABEL, "A coordinar");
  assert.equal(formatTaskVisit(null, null), NO_TASK_VISIT_LABEL);
});

test("los detalles opcionales ausentes se envían como null y mantienen compatibilidad", () => {
  const payload = buildTaskPayload({
    role: "cliente",
    editingId: null,
    form: { description: "Solicitud antigua", service: "Instalación" },
  });

  assert.equal(payload.serviceDetails, null);
  assert.equal(payload.visitDate, null);
  assert.equal(payload.visitTimeSlot, null);
});

test("la validación local señala detalles inválidos y permite guardar sin el bloque opcional", () => {
  assert.deepEqual(validateTaskServiceDetails("Instalación", null), {});
  assert.ok(validateTaskServiceDetails("Instalación", {
    equipment: [{ type: "modem", quantity: 0 }],
    speed: "no-definida",
    propertyType: "casa",
  }).equipment);
});

test("el resumen de detalles usa las etiquetas compartidas de las opciones", () => {
  assert.deepEqual(getTaskServiceDetailEntries("Instalación", serviceDetails), [
    { label: "Equipamiento solicitado", value: "Módem × 1" },
    { label: "Velocidad solicitada", value: "300 Mbps" },
    { label: "Tipo de inmueble", value: "Casa" },
  ]);
});
