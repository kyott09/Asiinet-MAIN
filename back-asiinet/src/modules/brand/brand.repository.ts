import { AppDataSource } from "../../database/data-source.js";
import { Brand } from "./brand.entity.js";

const repo = () => AppDataSource.getRepository(Brand);

export const findAll = async () => repo().find();

export const findById = async (id: number) => repo().findOneBy({ id });

export const findByDescripcion = async (descripcion: string) =>
  repo().findOneBy({ descripcion });

export const createBrand = async (data: Partial<Brand>) =>
  repo().save(repo().create(data));

export const updateBrand = async (id: number, data: Partial<Brand>) => {
  await repo().update(id, data);
  return findById(id);
};

export const deleteBrand = async (id: number) => repo().delete(id);