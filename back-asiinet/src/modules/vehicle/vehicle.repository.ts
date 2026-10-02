import { AppDataSource } from "../../database/data-source.js";
import { Vehicle } from "./vehicle.entity.js";

const repo = () => AppDataSource.getRepository(Vehicle);

export const findAll = async () =>
  repo().find({ relations: { vehicleModel: { brand: true } } });

export const findById = async (id: number) =>
  repo().findOne({ where: { id }, relations: { vehicleModel: { brand: true } } });

export const findByPatente = async (patente: string) =>
  repo().findOneBy({ patente });

export const createVehicle = async (data: Partial<Vehicle>) =>
  repo().save(repo().create(data));

export const updateVehicle = async (id: number, data: Partial<Vehicle>) => {
  await repo().update(id, data);
  return findById(id);
};

export const deleteVehicle = async (id: number) => repo().delete(id);