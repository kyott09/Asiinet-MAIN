import { Request, Response } from "express";
import * as vehicleModelService from "./vehicle-model.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";
import {
  parseVehicleModelInput,
  parseVehicleModelUpdateInput,
} from "../vehicle/vehicle.validation.js";

function parseId(raw: unknown, field = "id"): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw AppError.badRequest(`El ${field} debe ser un número entero positivo`);
  }
  return id;
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const vehicleModels = await vehicleModelService.getAll();
  res.status(200).json({ vehicleModels });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const vehicleModel = await vehicleModelService.getById(id);
  res.status(200).json({ vehicleModel });
});

export const getByBrand = asyncHandler(async (req: Request, res: Response) => {
  const brandId = parseId(req.params.brandId, "brandId");
  const vehicleModels = await vehicleModelService.getByBrand(brandId);
  res.status(200).json({ vehicleModels });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const validated = parseVehicleModelInput(req.body);
  const vehicleModel = await vehicleModelService.create({
    descripcion: validated.descripcion,
    brandId: validated.brandId,
  });
  res.status(201).json({ vehicleModel });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const validated = parseVehicleModelUpdateInput(req.body);
  const vehicleModel = await vehicleModelService.update(id, validated);
  res.status(200).json({ vehicleModel });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await vehicleModelService.remove(id);
  res.status(200).json({ message: "Modelo de vehículo eliminado correctamente" });
});