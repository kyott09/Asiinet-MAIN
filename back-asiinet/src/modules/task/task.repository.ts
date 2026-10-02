import { AppDataSource } from "../../database/data-source.js";
import { Task } from "./task.entity.js";

const repo = () => AppDataSource.getRepository(Task);

export const findAll = async () => repo().find({
  relations: { clientUser: true, employeeUser: true },
  order: { id: "ASC" },
});

export const findById = async (id: number) => repo().findOne({
  where: { id },
  relations: { clientUser: true, employeeUser: true },
});

export const create = async (data: Partial<Task>) =>
  repo().save(repo().create(data));

export const save = async (task: Task) => repo().save(task);

export const remove = async (task: Task) => repo().remove(task);