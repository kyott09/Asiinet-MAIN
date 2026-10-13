import { Request, Response } from "express";
import * as brandService from "./brand.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middlewares/errors.js";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const brands = await brandService.getAll();
  res.status(200).json(brands);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const brand = await brandService.getById(id);
  res.status(200).json(brand);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { descripcion } = req.body;
  const brand = await brandService.create({ descripcion });
  res.status(201).json(brand);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  const { descripcion } = req.body;
  const brand = await brandService.update(id, { descripcion });
  res.status(200).json(brand);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw AppError.badRequest("El id debe ser un número");

  await brandService.remove(id);
  res.status(204).send();
});