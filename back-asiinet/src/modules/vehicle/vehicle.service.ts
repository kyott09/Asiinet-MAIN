import * as vehicleRepository from "./vehicle.repository.js";
import * as vehicleModelRepository from "../vehicle-model/vehicle-model.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Vehicle } from "./vehicle.entity.js";
import { isForeignKeyConflict } from "./vehicle.validation.js";

export const getAll = async (filters?: { brandId?: number; modelId?: number }) =>
  vehicleRepository.findAll(filters);

export const getById = async (id: number) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");
  return vehicle;
};

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

export const create = async (data: CreateVehicleInput) => {
  const existing = await vehicleRepository.findByPatente(data.patente);
  if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");

  const vehicleModel = await vehicleModelRepository.findById(data.vehicleModelId);
  if (!vehicleModel) {
    throw AppError.badRequest("El modelo de vehículo indicado no existe", "INVALID_VEHICLE_MODEL");
  }

  const created = await vehicleRepository.createVehicle({
    patente: data.patente,
    color: data.color,
    descripcion: data.descripcion ?? null,
    estado: data.estado,
    anio: data.anio ?? null,
    vehicleModel,
  });

  return (await vehicleRepository.findById(created.id)) ?? created;
};

export const update = async (id: number, data: UpdateVehicleInput) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

  if (data.patente && data.patente !== vehicle.patente) {
    const existing = await vehicleRepository.findByPatente(data.patente);
    if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");
  }

  const updateData: Partial<Vehicle> = {};

  if (data.patente !== undefined) updateData.patente = data.patente;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.anio !== undefined) updateData.anio = data.anio;

  if (data.vehicleModelId !== undefined) {
    const vehicleModel = await vehicleModelRepository.findById(data.vehicleModelId);
    if (!vehicleModel) {
      throw AppError.badRequest("El modelo de vehículo indicado no existe", "INVALID_VEHICLE_MODEL");
    }
    updateData.vehicleModel = vehicleModel;
  }

  return vehicleRepository.updateVehicle(id, updateData);
};

export const remove = async (id: number) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

  try {
    await vehicleRepository.deleteVehicle(id);
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