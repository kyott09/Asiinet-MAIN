import { NextFunction, Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { AppError } from "../../middlewares/errors.js";
import { eventService } from "./event.service.js";
import { EVENT_TYPES } from "./event.types.js";

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidCalendarDate(val: string): boolean {
  if (!dateRegex.test(val)) return false;
  const parts = val.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return false;

  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseMonthParam(month?: unknown): string | undefined {
  if (month === undefined || month === null || month === "") {
    return undefined;
  }
  if (typeof month !== "string" || !monthRegex.test(month)) {
    throw AppError.badRequest("El parámetro month debe tener el formato YYYY-MM");
  }
  return month;
}

const createEventSchema = z
  .object({
    titulo: z
      .string({ message: "El título es obligatorio" })
      .trim()
      .min(1, "El título no puede estar vacío")
      .max(120, "El título no puede superar los 120 caracteres"),
    tipo: z.enum(EVENT_TYPES, {
      message: "Tipo de evento inválido",
    }),
    fecha: z
      .string({ message: "La fecha es obligatoria" })
      .refine(isValidCalendarDate, "Fecha inválida (debe ser YYYY-MM-DD y fecha real)"),
    descripcion: z
      .string()
      .max(500, "La descripción no puede superar los 500 caracteres")
      .nullable()
      .optional(),
  })
  .strict();

export function parseEventCreateInput(input: unknown) {
  const result = createEventSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues?.[0];
    throw AppError.badRequest(issue?.message || "Datos del evento inválidos");
  }
  return result.data;
}

const updateEventSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "El título no puede estar vacío")
      .max(120, "El título no puede superar los 120 caracteres")
      .optional(),
    tipo: z.enum(EVENT_TYPES).optional(),
    fecha: z
      .string()
      .refine(isValidCalendarDate, "Fecha inválida (debe ser YYYY-MM-DD y fecha real)")
      .optional(),
    descripcion: z
      .string()
      .max(500, "La descripción no puede superar los 500 caracteres")
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debe proporcionar al menos un campo para actualizar"
  );

export function parseEventUpdateInput(input: unknown) {
  const result = updateEventSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues?.[0];
    throw AppError.badRequest(issue?.message || "Datos de actualización inválidos");
  }
  return result.data;
}

export const getEvents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Sesión requerida");
    }

    const month = parseMonthParam(req.query.month);
    const events = await eventService.getAll(req.user, month);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Sesión requerida");
    }

    const payload = parseEventCreateInput(req.body);
    const created = await eventService.create(payload, req.user);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Sesión requerida");
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest("Identificador de evento inválido");
    }

    const payload = parseEventUpdateInput(req.body);
    const updated = await eventService.update(id, payload, req.user);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Sesión requerida");
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest("Identificador de evento inválido");
    }

    await eventService.remove(id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
