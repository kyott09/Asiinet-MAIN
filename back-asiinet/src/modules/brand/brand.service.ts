import * as brandRepository from "./brand.repository.js";
import * as vehicleModelRepository from "../vehicle-model/vehicle-model.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Brand } from "./brand.entity.js";
import { isForeignKeyConflict } from "../vehicle/vehicle.validation.js";

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

  const models = await vehicleModelRepository.findByBrandId(id);
  if (models.length > 0) {
    throw AppError.conflict("No se puede eliminar la marca porque tiene modelos asociados", "BRAND_HAS_MODELS");
  }

  try {
    await brandRepository.deleteBrand(id);
    return brand;
  } catch (err: any) {
    if (isForeignKeyConflict(err)) {
      throw AppError.conflict("No se puede eliminar la marca porque tiene dependencias asociadas", "BRAND_HAS_DEPENDENCIES");
    }
    throw err;
  }
};