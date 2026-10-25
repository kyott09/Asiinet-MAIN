import { AppDataSource } from "../../database/data-source.js";
import { Vehicle } from "./vehicle.entity.js";

const repo = () => AppDataSource.getRepository(Vehicle);

export const findAll = async (filters?: { brandId?: number; modelId?: number }) => {
  const where: any = {};
  if (filters?.modelId) {
    where.vehicleModel = { id: filters.modelId };
  }
  if (filters?.brandId) {
    where.vehicleModel = {
      ...(where.vehicleModel || {}),
      brand: { id: filters.brandId },
    };
  }

  return repo().find({
    where,
    relations: { vehicleModel: { brand: true } },
    order: { id: "DESC" },
  });
};

export const findById = async (id: number) =>
  repo().findOne({ where: { id }, relations: { vehicleModel: { brand: true } } });

export const findByModelId = async (modelId: number) =>
  repo().find({ where: { vehicleModel: { id: modelId } } });

export const findByPatente = async (patente: string) =>
  repo().findOneBy({ patente });

export const createVehicle = async (data: Partial<Vehicle>) =>
  repo().save(repo().create(data));

export const updateVehicle = async (id: number, data: Partial<Vehicle>) => {
  const existing = await findById(id);
  if (!existing) return null;
  Object.assign(existing, data);
  await repo().save(existing);
  return findById(id);
};

export const deleteVehicle = async (id: number) => repo().delete(id);