import { Request, Response } from "express";
import * as vehicleService from "./vehicle.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const vehicles = await vehicleService.getAll();
  res.status(200).json(vehicles);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const vehicle = await vehicleService.getById(id);
  res.status(200).json(vehicle);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { patente, color, descripcion, estado, vehicleModel, employee_id } = req.body;

  const vehicle = await vehicleService.create({
    patente,
    color,
    descripcion,
    estado,
    vehicleModel,
    employee_id,
  });

  res.status(201).json(vehicle);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const { patente, color, descripcion, estado, vehicleModel, employee_id } = req.body;

  const vehicle = await vehicleService.update(id, {
    patente,
    color,
    descripcion,
    estado,
    vehicleModel,
    employee_id,
  });

  res.status(200).json(vehicle);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  await vehicleService.remove(id);
  res.status(204).send();
});