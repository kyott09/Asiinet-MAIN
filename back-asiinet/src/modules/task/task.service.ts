import { normalizeRole } from "../../middlewares/auth.js";
import { AppError } from "../../middlewares/errors.js";
import * as userRepository from "../user/user.repository.js";
import * as taskRepository from "./task.repository.js";
import type { Task } from "./task.entity.js";
import type { TaskInput } from "./task.controller.js";

const FINALIZED_STATUSES = new Set(["terminada", "finalizada", "finalizado"]);

const isFinalizedStatus = (status?: string | null) => {
  if (!status) return false;
  return FINALIZED_STATUSES.has(status.trim().toLowerCase());
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value: Date | string) => {
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const serializeTask = (task: Task) => ({
  id: task.id,
  number: task.id,
  client: task.clientUser?.nombre || task.client,
  clientId: task.clientUser?.id ?? task.clientId,
  employee: task.employeeUser?.nombre || task.employee || "",
  employeeId: task.employeeUser?.id ?? task.employeeId,
  createdAt: formatDate(task.createdAt),
  dueDate: task.dueDate ? formatDate(task.dueDate) : "",
  description: task.description,
  service: task.service,
  priority: task.priority ?? "",
  status: task.status,
});

export const getAll = async (user?: { id: number; role?: string } | null) => {
  const tasks = await taskRepository.findAll();

  if (!user) {
    return tasks.map(serializeTask);
  }

  const role = normalizeRole(user.role);

  if (role === "admin" || role === "supervisor") {
    return tasks.map(serializeTask);
  }

  if (role === "operador") {
    return tasks
      .filter((task) => task.employeeId === user.id)
      .map(serializeTask);
  }

  if (role === "cliente") {
    return tasks
      .filter((task) => task.clientId === user.id)
      .map(serializeTask);
  }

  return [];
};

const getDefaultEmployee = async () => {
  const operators = await userRepository.findByRoles(["operador", "empleado"]);
  const employee = operators[0];

  if (!employee) {
    throw AppError.badRequest("No hay empleados disponibles para asignar la solicitud.");
  }

  return employee;
};

const hasActiveServiceRequest = async (clientId: number, service: string, excludeId?: number) => {
  const tasks = await taskRepository.findAll();

  return tasks.some((task) => {
    if (task.clientId !== clientId) return false;
    if (excludeId && task.id === excludeId) return false;
    if (task.service !== service) return false;
    return !isFinalizedStatus(task.status);
  });
};

const getAssignees = async (clientId: number, employeeId: number) => {
  const [client, employee] = await Promise.all([
    userRepository.findById(clientId),
    userRepository.findById(employeeId),
  ]);

  if (!client || normalizeRole(client.role) !== "cliente") {
    throw AppError.badRequest("Selecciona un cliente registrado con rol cliente.");
  }

  if (!employee || normalizeRole(employee.role) !== "operador") {
    throw AppError.badRequest("Selecciona un operador registrado con rol operador.");
  }

  return { client, employee };
};

export const create = async (
  input: TaskInput,
  actor?: { id: number; role?: string } | null
) => {
  const createdAt = today();

  const role = normalizeRole(actor?.role);
  const clientId = role === "cliente" ? actor!.id : input.clientId;

  if (role !== "cliente" && input.dueDate && input.dueDate < createdAt) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  if (role === "cliente") {
    const alreadyHasActiveRequest = await hasActiveServiceRequest(clientId, input.service);
    if (alreadyHasActiveRequest) {
      throw AppError.badRequest("Ya tienes una solicitud activa para este tipo de servicio.");
    }

    const client = await userRepository.findById(clientId);
    if (!client || normalizeRole(client.role) !== "cliente") {
      throw AppError.badRequest("Selecciona un cliente registrado con rol cliente.");
    }

    const task = await taskRepository.create({
      ...input,
      clientId,
      employeeId: null,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "Baja",
      createdAt,
      client: client.nombre || client.email,
      employee: null,
      clientUser: client,
      employeeUser: null,
      status: input.status ?? "Vista",
    });

    return serializeTask(task);
  }

  const employeeId = input.employeeId;
  if (!employeeId) {
    throw AppError.badRequest("Selecciona un empleado para asignar la tarea.");
  }

  if (input.dueDate && input.dueDate < createdAt) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  const { client, employee } = await getAssignees(clientId, employeeId);
  const task = await taskRepository.create({
    ...input,
    clientId,
    employeeId,
    createdAt,
    client: client.nombre || client.email,
    employee: employee.nombre || employee.email,
    clientUser: client,
    employeeUser: employee,
  });

  return serializeTask(task);
};

export const update = async (
  id: number,
  input: Partial<TaskInput>,
  actor?: { id: number; role?: string } | null
) => {
  const task = await taskRepository.findById(id);
  if (!task) throw AppError.notFound("Tarea no encontrada");

  const role = normalizeRole(actor?.role);

  if (role === "cliente") {
    if (task.clientId !== actor?.id) {
      throw AppError.forbidden("Solo puedes editar tus propias solicitudes.");
    }

    const nextDescription = input.description?.trim();
    if (!nextDescription) {
      throw AppError.badRequest("La descripción es obligatoria.");
    }

    Object.assign(task, {
      description: nextDescription,
    });

    return serializeTask(await taskRepository.save(task));
  }

  if (role === "operador") {
    if (task.employeeId !== actor?.id) {
      throw AppError.forbidden("Solo puedes modificar tus tareas asignadas.");
    }

    const nextDueDate = input.dueDate ?? task.dueDate;
    const nextStatus = input.status ?? task.status;

    if (nextDueDate < formatDate(task.createdAt)) {
      throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
    }

    Object.assign(task, {
      dueDate: nextDueDate,
      status: nextStatus,
    });

    return serializeTask(await taskRepository.save(task));
  }

  const nextDueDate = input.dueDate ?? task.dueDate;
  if (nextDueDate < formatDate(task.createdAt)) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  const { clientId, employeeId, ...taskFields } = input as TaskInput;
  const safeClientId = clientId ?? task.clientId ?? 0;
  const safeEmployeeId = employeeId ?? task.employeeId ?? 0;
  const { client, employee } = await getAssignees(safeClientId, safeEmployeeId);

  Object.assign(task, taskFields, {
    clientId: safeClientId,
    employeeId: safeEmployeeId,
    client: client.nombre || client.email,
    employee: employee.nombre || employee.email,
    clientUser: client,
    employeeUser: employee,
    dueDate: nextDueDate,
    status: input.status ?? task.status,
  });

  return serializeTask(await taskRepository.save(task));
};

export const remove = async (id: number) => {
  const task = await taskRepository.findById(id);
  if (!task) throw AppError.notFound("Tarea no encontrada");

  await taskRepository.remove(task);
};