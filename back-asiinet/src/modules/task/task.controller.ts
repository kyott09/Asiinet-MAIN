import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/errors.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as taskService from "./task.service.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "La fecha no es válida");

const taskSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  dueDate: dateSchema,
  description: z.string().trim().min(1),
  service: z.enum(["Instalación", "Reconexión", "Servicio técnico", "Desconexión"]),
  priority: z.enum(["Baja", "Media", "Alta"]),
  status: z.enum(["Vista", "En proceso", "Terminada", "No terminada"]),
});

export type TaskInput = z.infer<typeof taskSchema>;

const parseTaskInput = (body: unknown): TaskInput => {
  const result = taskSchema.safeParse(body);
  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de tarea no válidos");
  }

  return result.data;
};

const parseTaskId = (rawId: string | string[]) => {
  if (Array.isArray(rawId)) {
    throw AppError.badRequest("Identificador de tarea no válido");
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw AppError.badRequest("Identificador de tarea no válido");
  }

  return id;
};

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ tasks: await taskService.getAll() });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.create(parseTaskInput(req.body));
  res.status(201).json({ task });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.update(parseTaskId(req.params.id), parseTaskInput(req.body));
  res.status(200).json({ task });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await taskService.remove(parseTaskId(req.params.id));
  res.status(200).json({ message: "Tarea eliminada" });
});