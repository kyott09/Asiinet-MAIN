import { Request, Response } from "express";
import * as vehicleService from "./vehicle.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";
import {
  parseVehicleCreateInput,
  parseVehicleUpdateInput,
  parsePositiveIntFilter,
  formatVehicleResponse,
} from "./vehicle.validation.js";

function parseId(raw: unknown, field = "id"): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw AppError.badRequest(`El ${field} debe ser un número entero positivo`);
  }
  return id;
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const brandId = parsePositiveIntFilter(req.query.brandId, "brandId");
  const modelId = parsePositiveIntFilter(req.query.modelId, "modelId");

  const vehicles = await vehicleService.getAll({ brandId, modelId });
  res.status(200).json({ vehicles: vehicles.map(formatVehicleResponse) });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const vehicle = await vehicleService.getById(id);
  res.status(200).json({ vehicle: formatVehicleResponse(vehicle) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const validated = parseVehicleCreateInput(req.body);
  const vehicle = await vehicleService.create(validated);
  res.status(201).json({ vehicle: formatVehicleResponse(vehicle) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const validated = parseVehicleUpdateInput(req.body);
  const vehicle = await vehicleService.update(id, validated);
  res.status(200).json({ vehicle: formatVehicleResponse(vehicle!) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await vehicleService.remove(id);
  res.status(200).json({ message: "Vehículo eliminado correctamente" });
});