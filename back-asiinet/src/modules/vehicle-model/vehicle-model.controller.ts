import { Request, Response } from "express";
import * as vehicleModelService from "./vehicle-model.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const vehicleModels = await vehicleModelService.getAll();
  res.status(200).json(vehicleModels);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const vehicleModel = await vehicleModelService.getById(id);
  res.status(200).json(vehicleModel);
});

export const getByBrand = asyncHandler(async (req: Request, res: Response) => {
  const brandId = Number(req.params.brandId);
  if (Number.isNaN(brandId)) throw AppError.badRequest("El brandId debe ser un número");

  const vehicleModels = await vehicleModelService.getByBrand(brandId);
  res.status(200).json(vehicleModels);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { descripcion, brandId } = req.body;
  const vehicleModel = await vehicleModelService.create({ descripcion, brandId });
  res.status(201).json(vehicleModel);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const { descripcion, brandId } = req.body;
  const vehicleModel = await vehicleModelService.update(id, { descripcion, brandId });
  res.status(200).json(vehicleModel);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  await vehicleModelService.remove(id);
  res.status(204).send();
});