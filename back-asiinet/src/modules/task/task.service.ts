import { normalizeRole } from "../../middlewares/auth.js";
import { AppError } from "../../middlewares/errors.js";
import * as userRepository from "../user/user.repository.js";
import * as taskRepository from "./task.repository.js";
import type { Task } from "./task.entity.js";
import type { TaskInput } from "./task.controller.js";

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
  dueDate: formatDate(task.dueDate),
  description: task.description,
  service: task.service,
  priority: task.priority,
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
      .filter((task) => task.employeeId === user.id || task.clientId === user.id)
      .map(serializeTask);
  }

  if (role === "cliente") {
    return tasks
      .filter((task) => task.clientId === user.id)
      .map(serializeTask);
  }

  return [];
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

export const create = async (input: TaskInput) => {
  const createdAt = today();
  if (input.dueDate < createdAt) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  const { clientId, employeeId, ...taskFields } = input;
  const { client, employee } = await getAssignees(clientId, employeeId);
  const task = await taskRepository.create({
    ...taskFields,
    createdAt,
    client: client.nombre || client.email,
    employee: employee.nombre || employee.email,
    clientUser: client,
    employeeUser: employee,
  });

  return serializeTask(task);
};

export const update = async (id: number, input: TaskInput) => {
  const task = await taskRepository.findById(id);
  if (!task) throw AppError.notFound("Tarea no encontrada");

  if (input.dueDate < formatDate(task.createdAt)) {
    throw AppError.badRequest("La fecha de finalización no puede ser anterior a la fecha de creación.");
  }

  const { clientId, employeeId, ...taskFields } = input;
  const { client, employee } = await getAssignees(clientId, employeeId);
  Object.assign(task, taskFields, {
    client: client.nombre || client.email,
    employee: employee.nombre || employee.email,
    clientUser: client,
    employeeUser: employee,
  });
  return serializeTask(await taskRepository.save(task));
};

export const remove = async (id: number) => {
  const task = await taskRepository.findById(id);
  if (!task) throw AppError.notFound("Tarea no encontrada");

  await taskRepository.remove(task);
};