import * as brandRepository from "./brand.repository.js";
import * as vehicleModelRepository from "../vehicle-model/vehicle-model.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Brand } from "./brand.entity.js";
import { isForeignKeyConflict } from "../vehicle/vehicle.validation.js";

export const createBrandService = (dependencies = {
  findAll: brandRepository.findAll,
  findById: brandRepository.findById,
  findByDescripcion: brandRepository.findByDescripcion,
  createBrand: brandRepository.createBrand,
  updateBrand: brandRepository.updateBrand,
  deleteBrand: brandRepository.deleteBrand,
  findByBrandId: vehicleModelRepository.findByBrandId,
}) => {
  const getAll = async () => dependencies.findAll();

  const getById = async (id: number) => {
    const brand = await dependencies.findById(id);
    if (!brand) throw AppError.notFound("Marca no encontrada");
    return brand;
  };

  const create = async (data: Partial<Brand>) => {
    if (data.descripcion) {
      const existing = await dependencies.findByDescripcion(data.descripcion);
      if (existing) throw AppError.conflict("Ya existe una marca con esa descripción");
    }

    return dependencies.createBrand(data);
  };

  const update = async (id: number, data: Partial<Brand>) => {
    const brand = await dependencies.findById(id);
    if (!brand) throw AppError.notFound("Marca no encontrada");

    if (data.descripcion && data.descripcion !== brand.descripcion) {
      const existing = await dependencies.findByDescripcion(data.descripcion);
      if (existing) throw AppError.conflict("Ya existe una marca con esa descripción");
    }

    return dependencies.updateBrand(id, data);
  };

  const remove = async (id: number) => {
    const brand = await dependencies.findById(id);
    if (!brand) throw AppError.notFound("Marca no encontrada");

    const models = await dependencies.findByBrandId(id);
    if (models.length > 0) {
      throw AppError.conflict("No se puede eliminar la marca porque tiene modelos asociados", "BRAND_HAS_MODELS");
    }

    try {
      await dependencies.deleteBrand(id);
      return brand;
    } catch (err: any) {
      if (isForeignKeyConflict(err)) {
        throw AppError.conflict("No se puede eliminar la marca porque tiene dependencias asociadas", "BRAND_HAS_DEPENDENCIES");
      }
      throw err;
    }
  };

  return { getAll, getById, create, update, remove };
};

const defaultService = createBrandService();
export const getAll = defaultService.getAll;
export const getById = defaultService.getById;
export const create = defaultService.create;
export const update = defaultService.update;
export const remove = defaultService.remove;