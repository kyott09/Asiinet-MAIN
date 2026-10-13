import * as vehicleModelRepository from "./vehicle-model.repository.js";
import * as brandRepository from "../brand/brand.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { VehicleModel } from "./vehicle-model.entity.js";

export const getAll = async () => vehicleModelRepository.findAll();

export const getById = async (id: number) => {
  const vehicleModel = await vehicleModelRepository.findById(id);
  if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");
  return vehicleModel;
};

export const getByBrand = async (brandId: number) => {
  const brand = await brandRepository.findById(brandId);
  if (!brand) throw AppError.notFound("Marca no encontrada");

  return vehicleModelRepository.findByBrandId(brandId);
};

export const create = async (data: { descripcion: string; brandId: number }) => {
  const brand = await brandRepository.findById(data.brandId);
  if (!brand) throw AppError.badRequest("La marca indicada no existe", "INVALID_BRAND");

  return vehicleModelRepository.createVehicleModel({
    descripcion: data.descripcion,
    brand,
  });
};

export const update = async (
  id: number,
  data: { descripcion?: string; brandId?: number }
) => {
  const vehicleModel = await vehicleModelRepository.findById(id);
  if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");

  const updateData: Partial<VehicleModel> = {};

  if (data.descripcion !== undefined) {
    updateData.descripcion = data.descripcion;
  }

  if (data.brandId !== undefined) {
    const brand = await brandRepository.findById(data.brandId);
    if (!brand) throw AppError.badRequest("La marca indicada no existe", "INVALID_BRAND");
    updateData.brand = brand;
  }

  return vehicleModelRepository.updateVehicleModel(id, updateData);
};

export const remove = async (id: number) => {
  const vehicleModel = await vehicleModelRepository.findById(id);
  if (!vehicleModel) throw AppError.notFound("Modelo no encontrado");

  await vehicleModelRepository.deleteVehicleModel(id);
  return vehicleModel;
};