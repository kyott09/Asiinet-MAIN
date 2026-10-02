import { AppDataSource } from "../../database/data-source.js";
import { User } from "./user.entity.js";

const repo = () => AppDataSource.getRepository(User);

export const findByEmail = async (email: string) =>
  repo().findOneBy({ email });

export const findById = async (id: number) =>
  repo().findOneBy({ id });

export const findByRole = async (role: string) =>
  repo().find({ where: { role }, order: { nombre: "ASC" } });

export const createUser = async (data: Partial<User>) =>
  repo().save(repo().create(data));

export const updateUser = async (id: number, data: Partial<User>) => {
  const user = await repo().findOneBy({ id });
  if (!user) return null;

  Object.assign(user, data);
  return repo().save(user);
};


