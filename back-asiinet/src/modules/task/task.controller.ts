import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/errors.js";
import { AuthenticatedRequest, normalizeRole } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as taskService from "./task.service.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "La fecha no es válida");

const taskSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  dueDate: dateSchema.optional(),
  description: z.string().trim().min(1),
  service: z.enum(["Instalación", "Reconexión", "Servicio técnico", "Desconexión"]),
  priority: z.enum(["Baja", "Media", "Alta"]).optional(),
  status: z.enum(["Vista", "En proceso", "Terminada", "No terminada"]).optional(),
});

const clientRequestSchema = z.object({
  description: z.string().trim().min(1),
  service: z.enum(["Instalación", "Reconexión", "Servicio técnico", "Desconexión"]),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type ClientTaskRequest = z.infer<typeof clientRequestSchema>;

const getTodayDate = () => new Date().toLocaleDateString("en-CA");

export const parseTaskCreateInput = (body: unknown, role?: string | null): TaskInput | ClientTaskRequest => {
  const schema = normalizeRole(role) === "cliente" ? clientRequestSchema : taskSchema;
  const result = schema.safeParse(body);

  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de tarea no válidos");
  }

  const parsed = result.data;

  if (normalizeRole(role) === "cliente") {
    return {
      ...parsed,
      dueDate: getTodayDate(),
      priority: "Media",
      status: "Vista",
    } satisfies TaskInput & ClientTaskRequest;
  }

  return {
    ...parsed,
    dueDate: parsed.dueDate ?? getTodayDate(),
    priority: parsed.priority ?? "Media",
    status: parsed.status ?? "Vista",
  } as TaskInput;
};

const parseTaskUpdateInput = (body: unknown, role?: string | null) => {
  if (normalizeRole(role) === "cliente") {
    const updateSchema = z.object({
      description: z.string().trim().min(1),
    }).strict();

    const result = updateSchema.safeParse(body);
    if (!result.success) {
      throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de actualización no válidos");
    }

    return result.data;
  }

  const updateSchema = z.object({
    dueDate: dateSchema.optional(),
    status: z.enum(["Vista", "En proceso", "Terminada", "No terminada"]).optional(),
  }).strict();

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de actualización no válidos");
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

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  res.status(200).json({ tasks: await taskService.getAll(user) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const payload = parseTaskCreateInput(req.body, user?.role);

  if (user && normalizeRole(user.role) === "cliente") {
    const task = await taskService.create(
      {
        ...payload,
        clientId: user.id,
      } as TaskInput,
      user
    );

    return res.status(201).json({ task });
  }

  const task = await taskService.create(payload as TaskInput, user ?? null);
  return res.status(201).json({ task });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (user && normalizeRole(user.role) === "operador") {
    const payload = parseTaskUpdateInput(req.body);
    const task = await taskService.update(parseTaskId(req.params.id), payload, user);
    return res.status(200).json({ task });
  }

  if (user && normalizeRole(user.role) === "cliente") {
    const payload = parseTaskUpdateInput(req.body, user.role);
    const task = await taskService.update(parseTaskId(req.params.id), payload, user);
    return res.status(200).json({ task });
  }

  const payload = parseTaskCreateInput(req.body, user?.role) as TaskInput;
  const task = await taskService.update(parseTaskId(req.params.id), payload, user ?? null);
  return res.status(200).json({ task });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await taskService.remove(parseTaskId(req.params.id));
  res.status(200).json({ message: "Tarea eliminada" });
});