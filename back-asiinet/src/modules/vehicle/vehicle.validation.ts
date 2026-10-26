import { z } from "zod";
import { AppError } from "../../middlewares/errors.js";
import { Vehicle } from "./vehicle.entity.js";

const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

const currentMaxYear = () => new Date().getFullYear() + 1;

export const ESTADOS_VEHICULO = ["disponible", "en_uso", "mantenimiento"] as const;
export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];

export const patenteSchema = z
  .string()
  .transform((val) => val.trim().toUpperCase())
  .refine((val) => PATENTE_REGEX.test(val), {
    message: "La patente debe tener formato argentino válido (ej: ABC123 o AB123CD)",
  });

export const anioSchema = z
  .union([
    z.number().int().refine((val) => val >= 1980 && val <= currentMaxYear(), {
      message: `El año debe estar entre 1980 y ${currentMaxYear()}`,
    }),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (val === undefined || val === null ? null : val));

export const estadoSchema = z.enum(ESTADOS_VEHICULO, {
  error: () => ({ message: "El estado debe ser disponible, en_uso o mantenimiento" }),
});

export const vehicleCreateSchema = z.object({
  patente: patenteSchema,
  color: z.string().trim().min(1, "El color es obligatorio").max(50),
  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar 500 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  estado: estadoSchema,
  anio: anioSchema.default(null),
  vehicleModelId: z.number().int().positive("El modelo de vehículo debe ser un id válido"),
}).strict();

export const vehicleUpdateSchema = z.object({
  patente: patenteSchema.optional(),
  color: z.string().trim().min(1, "El color no puede estar vacío").max(50).optional(),
  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar 500 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val !== undefined ? (val ? val : null) : undefined)),
  estado: estadoSchema.optional(),
  anio: anioSchema.optional(),
  vehicleModelId: z.number().int().positive("El modelo de vehículo debe ser un id válido").optional(),
}).strict();

export const brandSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción de la marca es obligatoria").max(100),
}).strict();

export const vehicleModelSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción del modelo es obligatoria").max(100),
  brandId: z.number().int().positive("La marca debe ser un id válido"),
}).strict();

export const vehicleModelUpdateSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción no puede estar vacía").max(100).optional(),
  brandId: z.number().int().positive("La marca debe ser un id válido").optional(),
}).strict();

export function parseVehicleCreateInput(raw: unknown) {
  const parsed = vehicleCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw AppError.badRequest(message || "Datos de vehículo inválidos");
  }
  return parsed.data;
}

export function parseVehicleUpdateInput(raw: unknown) {
  const parsed = vehicleUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw AppError.badRequest(message || "Datos de actualización inválidos");
  }
  return parsed.data;
}

export function parseBrandInput(raw: unknown) {
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw AppError.badRequest(message || "Datos de marca inválidos");
  }
  return parsed.data;
}

export function parseVehicleModelInput(raw: unknown) {
  const parsed = vehicleModelSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw AppError.badRequest(message || "Datos de modelo inválidos");
  }
  return parsed.data;
}

export function parseVehicleModelUpdateInput(raw: unknown) {
  const parsed = vehicleModelUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw AppError.badRequest(message || "Datos de actualización inválidos");
  }
  return parsed.data;
}

export function parsePositiveIntFilter(value: unknown, paramName: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw AppError.badRequest(`El filtro ${paramName} debe ser un número entero positivo`);
  }
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    throw AppError.badRequest(`El filtro ${paramName} debe ser un número entero positivo`);
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) {
    throw AppError.badRequest(`El filtro ${paramName} debe ser un número entero positivo`);
  }
  return num;
}

export function formatVehicleResponse(vehicle: Vehicle) {
  const { employee_id, ...rest } = vehicle;
  return rest;
}

export function isForeignKeyConflict(err: any): boolean {
  return (
    err?.code === "ER_ROW_IS_REFERENCED_2" ||
    err?.errno === 1451 ||
    err?.driverError?.code === "ER_ROW_IS_REFERENCED_2" ||
    err?.driverError?.errno === 1451
  );
}
