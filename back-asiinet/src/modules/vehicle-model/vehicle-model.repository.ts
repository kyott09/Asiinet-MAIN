import { AppDataSource } from "../../database/data-source.js";
import { VehicleModel } from "./vehicle-model.entity.js";

const repo = () => AppDataSource.getRepository(VehicleModel);

export const findAll = async () =>
  repo().find({ relations: { brand: true } });

export const findById = async (id: number) =>
  repo().findOne({ where: { id }, relations: { brand: true } });

export const findByBrandId = async (brandId: number) =>
  repo().find({ where: { brand: { id: brandId } }, relations: { brand: true } });

export const createVehicleModel = async (data: Partial<VehicleModel>) =>
  repo().save(repo().create(data));

export const updateVehicleModel = async (id: number, data: Partial<VehicleModel>) => {
  await repo().update(id, data);
  return findById(id);
};

export const deleteVehicleModel = async (id: number) => repo().delete(id);