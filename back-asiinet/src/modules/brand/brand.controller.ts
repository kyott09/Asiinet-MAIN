import { Request, Response } from "express";
import * as brandService from "./brand.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";
import { parseBrandInput } from "../vehicle/vehicle.validation.js";

function parseId(raw: unknown, field = "id"): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw AppError.badRequest(`El ${field} debe ser un número entero positivo`);
  }
  return id;
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const brands = await brandService.getAll();
  res.status(200).json({ brands });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const brand = await brandService.getById(id);
  res.status(200).json({ brand });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const validated = parseBrandInput(req.body);
  const brand = await brandService.create({ descripcion: validated.descripcion });
  res.status(201).json({ brand });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const validated = parseBrandInput(req.body);
  const brand = await brandService.update(id, { descripcion: validated.descripcion });
  res.status(200).json({ brand });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await brandService.remove(id);
  res.status(200).json({ message: "Marca eliminada correctamente" });
});