const ROLE_ALIASES = {
  user: "cliente",
  client: "cliente",
  empleado: "operador",
  employee: "operador",
};

function normalizeRole(role) {
  const normalized = String(role ?? "cliente").trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? normalized;
}

export function buildTaskPayload({ role, editingId, form, canWriteVisit = true }) {
  const normalizedRole = normalizeRole(role);
  const isEditing = editingId !== null && editingId !== undefined;

  if (normalizedRole === "cliente") {
    if (isEditing) return { description: form.description };
    return {
      description: form.description,
      service: form.service,
      serviceDetails: form.serviceDetails ?? null,
      visitDate: form.visitDate || null,
      visitTimeSlot: form.visitTimeSlot || null,
    };
  }

  if (normalizedRole === "operador") {
    if (!isEditing) return null;
    return {
      dueDate: form.dueDate || null,
      status: form.status,
    };
  }

  if (normalizedRole !== "admin" && normalizedRole !== "supervisor") {
    throw new Error("Rol no válido para construir el payload de tarea.");
  }

  const payload = {
    clientId: form.clientId,
    employeeId: form.employeeId || null,
    dueDate: form.dueDate || null,
    description: form.description,
    service: form.service,
    priority: form.priority,
    status: form.status,
    serviceDetails: form.serviceDetails ?? null,
  };

  if (canWriteVisit) {
    payload.visitDate = form.visitDate || null;
    payload.visitTimeSlot = form.visitTimeSlot || null;
  }

  return payload;
}
