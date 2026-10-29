import { AppDataSource } from "../../database/data-source.js";
import { Task } from "./task.entity.js";

const repo = () => AppDataSource.getRepository(Task);

export interface TaskPageFilters {
  q?: string;
  status?: "todos" | "vista" | "en_proceso" | "terminada" | "cancelacion";
}

export interface TaskPageQuery {
  page: number;
  pageSize: number;
  filters: TaskPageFilters;
  actor: { id: number; role: string };
}

export const findAll = async () => repo().find({
  relations: { clientUser: true, employeeUser: true },
  order: { id: "ASC" },
});

export const findPage = async ({
  page,
  pageSize,
  filters,
  actor,
}: TaskPageQuery) => {
  const query = repo()
    .createQueryBuilder("task")
    .leftJoinAndSelect("task.clientUser", "clientUser")
    .leftJoinAndSelect("task.employeeUser", "employeeUser")
    .orderBy("task.id", "ASC");

  if (actor.role === "operador") {
    query.where("task.employeeId = :actorId", { actorId: actor.id });
  } else if (actor.role === "cliente") {
    query.where("task.clientId = :actorId", { actorId: actor.id });
  } else if (actor.role !== "admin" && actor.role !== "supervisor") {
    query.where("1 = 0");
  }

  const statusesByFilter = {
    vista: ["vista"],
    en_proceso: ["en proceso"],
    terminada: ["terminada", "finalizada", "finalizado"],
    cancelacion: ["no terminada", "cancelada", "cancelado"],
  } as const;
  if (filters.status && filters.status !== "todos") {
    query.andWhere("LOWER(task.status) IN (:...statuses)", {
      statuses: statusesByFilter[filters.status],
    });
  }

  if (filters.q) {
    const search = `%${filters.q.toLowerCase()}%`;
    query.andWhere(`(
      CAST(task.id AS CHAR) LIKE :search
      OR LOWER(COALESCE(clientUser.nombre, task.client, '')) LIKE :search
      OR LOWER(COALESCE(employeeUser.nombre, task.employee, '')) LIKE :search
      OR LOWER(task.service) LIKE :search
      OR LOWER(task.description) LIKE :search
      OR LOWER(task.status) LIKE :search
      OR LOWER(CASE
        WHEN LOWER(task.status) = 'vista' THEN 'recibido'
        WHEN LOWER(task.status) IN ('terminada', 'finalizada', 'finalizado') THEN 'terminada'
        WHEN LOWER(task.status) IN ('no terminada', 'cancelada', 'cancelado') THEN 'cancelación'
        ELSE task.status
      END) LIKE :search
      OR DATE_FORMAT(task.createdAt, '%Y-%m-%d') LIKE :search
      OR LOWER(COALESCE(DATE_FORMAT(task.dueDate, '%Y-%m-%d'), 'sin fecha')) LIKE :search
      OR DATE_FORMAT(task.visitDate, '%Y-%m-%d') LIKE :search
      OR LOWER(task.priority) LIKE :search
    )`, { search });
  }

  const total = await query.clone().getCount();
  const tasks = await query
    .clone()
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();

  return { tasks, total };
};

export const findById = async (id: number) => repo().findOne({
  where: { id },
  relations: { clientUser: true, employeeUser: true },
});

export const create = async (data: Partial<Task>) =>
  repo().save(repo().create(data));

export const save = async (task: Task) => repo().save(task);

export const remove = async (task: Task) => repo().remove(task);