import * as brandRepository from "./brand.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Brand } from "./brand.entity.js";

export const getAll = async () => brandRepository.findAll();

export const getById = async (id: number) => {
  const brand = await brandRepository.findById(id);
  if (!brand) throw AppError.notFound("Marca no encontrada");
  return brand;
};

export const create = async (data: Partial<Brand>) => {
  if (data.descripcion) {
    const existing = await brandRepository.findByDescripcion(data.descripcion);
    if (existing) throw AppError.conflict("Ya existe una marca con esa descripción");
  }

  return brandRepository.createBrand(data);
};

export const update = async (id: number, data: Partial<Brand>) => {
  const brand = await brandRepository.findById(id);
  if (!brand) throw AppError.notFound("Marca no encontrada");

  if (data.descripcion && data.descripcion !== brand.descripcion) {
    const existing = await brandRepository.findByDescripcion(data.descripcion);
    if (existing) throw AppError.conflict("Ya existe una marca con esa descripción");
  }

  return brandRepository.updateBrand(id, data);
};

export const remove = async (id: number) => {
  const brand = await brandRepository.findById(id);
  if (!brand) throw AppError.notFound("Marca no encontrada");

  await brandRepository.deleteBrand(id);
  return brand;
};