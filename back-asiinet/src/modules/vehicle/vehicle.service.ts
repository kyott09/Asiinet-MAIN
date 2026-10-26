import * as vehicleRepository from "./vehicle.repository.js";
import * as vehicleModelRepository from "../vehicle-model/vehicle-model.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Vehicle } from "./vehicle.entity.js";
import { isForeignKeyConflict } from "./vehicle.validation.js";

export interface CreateVehicleInput {
  patente: string;
  color: string;
  descripcion?: string | null;
  estado: string;
  anio?: number | null;
  vehicleModelId: number;
}

export interface UpdateVehicleInput {
  patente?: string;
  color?: string;
  descripcion?: string | null;
  estado?: string;
  anio?: number | null;
  vehicleModelId?: number;
}

export const createVehicleService = (dependencies = {
  findAll: vehicleRepository.findAll,
  findById: vehicleRepository.findById,
  findByPatente: vehicleRepository.findByPatente,
  createVehicle: vehicleRepository.createVehicle,
  updateVehicle: vehicleRepository.updateVehicle,
  deleteVehicle: vehicleRepository.deleteVehicle,
  findVehicleModelById: vehicleModelRepository.findById,
}) => {
  const getAll = async (filters?: { brandId?: number; modelId?: number }) =>
    dependencies.findAll(filters);

  const getById = async (id: number) => {
    const vehicle = await dependencies.findById(id);
    if (!vehicle) throw AppError.notFound("Vehículo no encontrado");
    return vehicle;
  };

  const create = async (data: CreateVehicleInput) => {
    const existing = await dependencies.findByPatente(data.patente);
    if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");

    const vehicleModel = await dependencies.findVehicleModelById(data.vehicleModelId);
    if (!vehicleModel) {
      throw AppError.badRequest("El modelo de vehículo indicado no existe", "INVALID_VEHICLE_MODEL");
    }

    const created = await dependencies.createVehicle({
      patente: data.patente,
      color: data.color,
      descripcion: data.descripcion ?? null,
      estado: data.estado,
      anio: data.anio ?? null,
      vehicleModel,
    });

    return (await dependencies.findById(created.id)) ?? created;
  };

  const update = async (id: number, data: UpdateVehicleInput) => {
    const vehicle = await dependencies.findById(id);
    if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

    if (data.patente && data.patente !== vehicle.patente) {
      const existing = await dependencies.findByPatente(data.patente);
      if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");
    }

    const updateData: Partial<Vehicle> = {};

    if (data.patente !== undefined) updateData.patente = data.patente;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.anio !== undefined) updateData.anio = data.anio;

    if (data.vehicleModelId !== undefined) {
      const vehicleModel = await dependencies.findVehicleModelById(data.vehicleModelId);
      if (!vehicleModel) {
        throw AppError.badRequest("El modelo de vehículo indicado no existe", "INVALID_VEHICLE_MODEL");
      }
      updateData.vehicleModel = vehicleModel;
    }

    return dependencies.updateVehicle(id, updateData);
  };

  const remove = async (id: number) => {
    const vehicle = await dependencies.findById(id);
    if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

    try {
      await dependencies.deleteVehicle(id);
      return vehicle;
    } catch (err: any) {
      if (isForeignKeyConflict(err)) {
        throw AppError.conflict(
          "No se puede eliminar el vehículo porque tiene dependencias asociadas",
          "VEHICLE_HAS_DEPENDENCIES"
        );
      }
      throw err;
    }
  };

  return { getAll, getById, create, update, remove };
};

const defaultService = createVehicleService();
export const getAll = defaultService.getAll;
export const getById = defaultService.getById;
export const create = defaultService.create;
export const update = defaultService.update;
export const remove = defaultService.remove;