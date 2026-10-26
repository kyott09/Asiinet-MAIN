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

export function buildTaskPayload({ role, editingId, form }) {
  const normalizedRole = normalizeRole(role);
  const isEditing = editingId !== null && editingId !== undefined;

  if (normalizedRole === "cliente") {
    if (isEditing) return { description: form.description };
    return {
      description: form.description,
      service: form.service,
      serviceDetails: form.serviceDetails ?? null,
    };
  }

  if (normalizedRole === "operador") {
    if (!isEditing) return null;
    return {
      dueDate: form.dueDate,
      status: form.status,
    };
  }

  if (normalizedRole !== "admin" && normalizedRole !== "supervisor") {
    throw new Error("Rol no válido para construir el payload de tarea.");
  }

  return {
    clientId: form.clientId,
    employeeId: form.employeeId,
    dueDate: form.dueDate,
    description: form.description,
    service: form.service,
    priority: form.priority,
    status: form.status,
    serviceDetails: form.serviceDetails ?? null,
  };
}
