import { normalizeRole } from "../../middlewares/auth.js";
import { AppError } from "../../middlewares/errors.js";
import * as userRepository from "../user/user.repository.js";
import * as taskRepository from "./task.repository.js";
import type { TaskPageFilters } from "./task.repository.js";
import type { Task } from "./task.entity.js";
import type { TaskInput } from "./task.controller.js";

const FINALIZED_STATUSES = new Set(["terminada", "finalizada", "finalizado"]);

const isFinalizedStatus = (status?: string | null) => {
  if (!status) return false;
  return FINALIZED_STATUSES.has(status.trim().toLowerCase());
};

const today = () => {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatDate = (value: Date | string) => {
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatVisitDate = (value: Date | string) =>
  typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);

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
  serviceDetails: task.serviceDetails ?? null,
  visitDate: task.visitDate ? formatVisitDate(task.visitDate) : null,
  visitTimeSlot: task.visitTimeSlot ?? null,
});

type TaskRepositoryAdapter = Pick<typeof taskRepository, "findAll" | "findById" | "create" | "save" | "remove">
  & Partial<Pick<typeof taskRepository, "findPage">>;
type UserRepositoryAdapter = Pick<typeof userRepository, "findById" | "findByRoles">;

export const createTaskService = ({
  tasks: tasksRepository = taskRepository,
  users: usersRepository = userRepository,
  today: todayProvider = today,
}: {
  tasks?: TaskRepositoryAdapter;
  users?: UserRepositoryAdapter;
  today?: () => string;
} = {}) => {
const getAll = async (user?: { id: number; role?: string } | null) => {
  const tasks = await tasksRepository.findAll();

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

const getPage = async (
  input: { page: number; pageSize: number; filters: TaskPageFilters },
  user: { id: number; role?: string } | null
) => {
  const actor = {
    id: user?.id ?? 0,
    role: normalizeRole(user?.role),
  };
  const findPage = tasksRepository.findPage;
  if (!findPage) {
    throw new Error("El repositorio de tareas no implementa findPage.");
  }
  const { tasks, total } = await findPage({
    ...input,
    actor,
  });

  return {
    tasks: tasks.map(serializeTask),
    meta: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    },
  };
};

const getDefaultEmployee = async () => {
  const operators = await usersRepository.findByRoles(["operador", "empleado"]);
  const employee = operators[0];

  if (!employee) {
    throw AppError.badRequest("No hay empleados disponibles para asignar la solicitud.");
  }

  return employee;
};

const hasActiveServiceRequest = async (clientId: number, service: string, excludeId?: number) => {
  const tasks = await tasksRepository.findAll();

  return tasks.some((task) => {
    if (task.clientId !== clientId) return false;
    if (excludeId && task.id === excludeId) return false;
    if (task.service !== service) return false;
    return !isFinalizedStatus(task.status);
  });
};

const getAssignees = async (clientId: number, employeeId: number | null) => {
  const [client, employee] = await Promise.all([
    usersRepository.findById(clientId),
    employeeId === null ? Promise.resolve(null) : usersRepository.findById(employeeId),
  ]);

  if (!client || normalizeRole(client.role) !== "cliente") {
    throw AppError.badRequest("Selecciona un cliente registrado con rol cliente.");
  }

  if (employeeId !== null && (!employee || normalizeRole(employee.role) !== "operador")) {
    throw AppError.badRequest("Selecciona un operador registrado con rol operador.");
  }

  return { client, employee };
};

const create = async (
  input: TaskInput,
  actor?: { id: number; role?: string } | null
) => {
  const createdAt = todayProvider();

  const role = normalizeRole(actor?.role);
  const clientId = role === "cliente" ? actor!.id : input.clientId;
  if (input.visitDate && input.visitDate < todayProvider()) {
    throw AppError.badRequest("La fecha de visita no puede ser anterior a hoy.");
  }

  if (role !== "cliente" && input.dueDate && input.dueDate < createdAt) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  if (role === "cliente") {
    const alreadyHasActiveRequest = await hasActiveServiceRequest(clientId, input.service);
    if (alreadyHasActiveRequest) {
      throw AppError.badRequest("Ya tienes una solicitud activa para este tipo de servicio.");
    }

    const client = await usersRepository.findById(clientId);
    if (!client || normalizeRole(client.role) !== "cliente") {
      throw AppError.badRequest("Selecciona un cliente registrado con rol cliente.");
    }

    const task = await tasksRepository.create({
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
      serviceDetails: input.serviceDetails ?? null,
      visitDate: input.visitDate ?? null,
      visitTimeSlot: input.visitTimeSlot ?? null,
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
  if (!employee) {
    throw AppError.badRequest("Selecciona un operador registrado con rol operador.");
  }
  const task = await tasksRepository.create({
    ...input,
    clientId,
    employeeId,
    createdAt,
    client: client.nombre || client.email,
    employee: employee.nombre || employee.email,
    clientUser: client,
    employeeUser: employee,
    serviceDetails: role === "operador" ? null : input.serviceDetails ?? null,
    visitDate: role === "operador" ? null : input.visitDate ?? null,
    visitTimeSlot: role === "operador" ? null : input.visitTimeSlot ?? null,
  });

  return serializeTask(task);
};

const update = async (
  id: number,
  input: Partial<TaskInput>,
  actor?: { id: number; role?: string } | null
) => {
  const task = await tasksRepository.findById(id);
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

    return serializeTask(await tasksRepository.save(task));
  }

  if (role === "operador") {
    if (task.employeeId !== actor?.id) {
      throw AppError.forbidden("Solo puedes modificar tus tareas asignadas.");
    }

    const nextDueDate = input.dueDate ?? null;
    const nextStatus = input.status ?? task.status;

    if (nextDueDate !== null && nextDueDate < formatDate(task.createdAt)) {
      throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
    }

    Object.assign(task, {
      dueDate: nextDueDate,
      status: nextStatus,
    });

    return serializeTask(await tasksRepository.save(task));
  }

  const nextDueDate = input.dueDate ?? null;
  if (nextDueDate !== null && nextDueDate < formatDate(task.createdAt)) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  const { clientId, employeeId, ...taskFields } = input as TaskInput;
  const safeClientId = clientId ?? task.clientId ?? 0;
  const nextEmployeeId = employeeId === undefined ? task.employeeId ?? null : employeeId;
  if (task.employeeId !== null && task.employeeId !== undefined && nextEmployeeId === null) {
    throw AppError.badRequest("No se puede quitar el operador asignado.");
  }
  const nextStatus = input.status ?? task.status;
  if (nextStatus !== "Vista" && nextEmployeeId === null) {
    throw AppError.badRequest("Selecciona un operador registrado con rol operador.");
  }
  const { client, employee } = await getAssignees(safeClientId, nextEmployeeId);
  const hasVisitDate = Object.prototype.hasOwnProperty.call(input, "visitDate");
  const hasVisitTimeSlot = Object.prototype.hasOwnProperty.call(input, "visitTimeSlot");
  if (
    hasVisitDate !== hasVisitTimeSlot
    || (hasVisitDate && ((input.visitDate === null) !== (input.visitTimeSlot === null)))
  ) {
    throw AppError.badRequest("La fecha y la franja de visita deben enviarse juntas.");
  }

  const nextVisitDate = hasVisitDate ? input.visitDate ?? null : task.visitDate ?? null;
  const nextVisitTimeSlot = hasVisitTimeSlot ? input.visitTimeSlot ?? null : task.visitTimeSlot ?? null;
  const visitDateChanged = nextVisitDate !== (task.visitDate ?? null);
  if (visitDateChanged && nextVisitDate !== null && nextVisitDate < todayProvider()) {
    throw AppError.badRequest("La fecha de visita no puede ser anterior a hoy.");
  }

  const serviceChanged = input.service !== task.service;
  const nextServiceDetails = Object.prototype.hasOwnProperty.call(input, "serviceDetails")
    ? input.serviceDetails ?? null
    : serviceChanged
      ? null
      : task.serviceDetails ?? null;

  Object.assign(task, taskFields, {
    clientId: safeClientId,
    employeeId: nextEmployeeId,
    client: client.nombre || client.email,
    employee: employee?.nombre || employee?.email || null,
    clientUser: client,
    employeeUser: employee,
    dueDate: nextDueDate,
    status: nextStatus,
    serviceDetails: nextServiceDetails,
    visitDate: nextVisitDate,
    visitTimeSlot: nextVisitTimeSlot,
  });

  return serializeTask(await tasksRepository.save(task));
};

const remove = async (id: number) => {
  const task = await tasksRepository.findById(id);
  if (!task) throw AppError.notFound("Tarea no encontrada");

  await tasksRepository.remove(task);
};

return { getAll, getPage, create, update, remove };
};

const defaultTaskService = createTaskService();
export const getAll = defaultTaskService.getAll;
export const getPage = defaultTaskService.getPage;
export const create = defaultTaskService.create;
export const update = defaultTaskService.update;
export const remove = defaultTaskService.remove;