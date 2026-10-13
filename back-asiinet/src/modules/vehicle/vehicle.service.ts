import * as vehicleRepository from "./vehicle.repository.js";
import { AppError } from "../../middlewares/errors.js";
import { Vehicle } from "./vehicle.entity.js";

export const getAll = async () => vehicleRepository.findAll();

export const getById = async (id: number) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");
  return vehicle;
};

export const create = async (data: Partial<Vehicle>) => {
  if (data.patente) {
    const existing = await vehicleRepository.findByPatente(data.patente);
    if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");
  }

  return vehicleRepository.createVehicle(data);
};

export const update = async (id: number, data: Partial<Vehicle>) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

  if (data.patente && data.patente !== vehicle.patente) {
    const existing = await vehicleRepository.findByPatente(data.patente);
    if (existing) throw AppError.conflict("Ya existe un vehículo con esa patente");
  }

  return vehicleRepository.updateVehicle(id, data);
};

export const remove = async (id: number) => {
  const vehicle = await vehicleRepository.findById(id);
  if (!vehicle) throw AppError.notFound("Vehículo no encontrado");

  await vehicleRepository.deleteVehicle(id);
  return vehicle;
};