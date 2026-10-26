import * as vehicleModelRepository from "./vehicle-model.repository.js";
import * as brandRepository from "../brand/brand.repository.js";
import * as vehicleRepository from "../vehicle/vehicle.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { VehicleModel } from "./vehicle-model.entity.js";
import { isForeignKeyConflict } from "../vehicle/vehicle.validation.js";

export const createVehicleModelService = (dependencies = {
  findAll: vehicleModelRepository.findAll,
  findById: vehicleModelRepository.findById,
  findByBrandId: vehicleModelRepository.findByBrandId,
  createVehicleModel: vehicleModelRepository.createVehicleModel,
  updateVehicleModel: vehicleModelRepository.updateVehicleModel,
  deleteVehicleModel: vehicleModelRepository.deleteVehicleModel,
  findBrandById: brandRepository.findById,
  findVehiclesByModelId: vehicleRepository.findByModelId,
}) => {
  const getAll = async () => dependencies.findAll();

  const getById = async (id: number) => {
    const vehicleModel = await dependencies.findById(id);
    if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");
    return vehicleModel;
  };

  const getByBrand = async (brandId: number) => {
    const brand = await dependencies.findBrandById(brandId);
    if (!brand) throw AppError.notFound("Marca no encontrada");

    return dependencies.findByBrandId(brandId);
  };

  const create = async (data: { descripcion: string; brandId: number }) => {
    const brand = await dependencies.findBrandById(data.brandId);
    if (!brand) throw AppError.badRequest("La marca indicada no existe", "INVALID_BRAND");

    return dependencies.createVehicleModel({ descripcion: data.descripcion, brand });
  };

  const update = async (id: number, data: { descripcion?: string; brandId?: number }) => {
    const vehicleModel = await dependencies.findById(id);
    if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");

    const updateData: Partial<VehicleModel> = {};

    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;

    if (data.brandId !== undefined) {
      const brand = await dependencies.findBrandById(data.brandId);
      if (!brand) throw AppError.badRequest("La marca indicada no existe", "INVALID_BRAND");
      updateData.brand = brand;
    }

    return dependencies.updateVehicleModel(id, updateData);
  };

  const remove = async (id: number) => {
    const vehicleModel = await dependencies.findById(id);
    if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");

    const vehicles = await dependencies.findVehiclesByModelId(id);
    if (vehicles.length > 0) {
      throw AppError.conflict("No se puede eliminar el modelo porque tiene vehículos asociados", "MODEL_HAS_VEHICLES");
    }

    try {
      await dependencies.deleteVehicleModel(id);
      return vehicleModel;
    } catch (err: any) {
      if (isForeignKeyConflict(err)) {
        throw AppError.conflict("No se puede eliminar el modelo porque tiene dependencias asociadas", "MODEL_HAS_DEPENDENCIES");
      }
      throw err;
    }
  };

  return { getAll, getById, getByBrand, create, update, remove };
};

const defaultService = createVehicleModelService();
export const getAll = defaultService.getAll;
export const getById = defaultService.getById;
export const getByBrand = defaultService.getByBrand;
export const create = defaultService.create;
export const update = defaultService.update;
export const remove = defaultService.remove;