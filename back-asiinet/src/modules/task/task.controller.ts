import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/errors.js";
import { AuthenticatedRequest, normalizeRole } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as taskService from "./task.service.js";
import { SERVICE_DETAIL_OPTIONS, type TaskServiceName } from "../../../../shared/taskServiceDetails.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "La fecha no es válida");

const normalizePriorityValue = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized === "baja") return "Baja";
  if (normalized === "media") return "Media";
  if (normalized === "alta") return "Alta";

  return trimmed;
};

const normalizeStatusValue = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized === "vista") return "Vista";
  if (normalized === "en proceso") return "En proceso";
  if (normalized === "terminada" || normalized === "finalizada" || normalized === "finalizado") return "Terminada";
  if (normalized === "no terminada" || normalized === "no_terminada") return "No terminada";

  return trimmed;
};

const SERVICE_NAMES = ["Instalación", "Reconexión", "Servicio técnico", "Desconexión"] as const;

const optionValues = (service: TaskServiceName, fieldName: string) => {
  const field = SERVICE_DETAIL_OPTIONS[service].find((option) => option.name === fieldName);
  if (!field?.options.length) throw new Error(`Faltan opciones para ${service}.${fieldName}`);
  return field.options.map(({ value }) => value) as [string, ...string[]];
};

const fieldDefinition = (service: TaskServiceName, fieldName: string) => {
  const field = SERVICE_DETAIL_OPTIONS[service].find((option) => option.name === fieldName);
  if (!field) throw new Error(`Falta definición para ${service}.${fieldName}`);
  return field;
};

const optionFieldSchema = (service: TaskServiceName, fieldName: string) => {
  const field = fieldDefinition(service, fieldName);
  const schema = z.enum(optionValues(service, fieldName)).refine(
    (value) => field.maxLength === undefined || value.length <= field.maxLength
  );
  return field.required ? schema : schema.optional();
};

const optionItemSchema = (service: TaskServiceName, fieldName: string) => {
  const field = fieldDefinition(service, fieldName);
  return z.enum(optionValues(service, fieldName)).refine(
    (value) => field.maxLength === undefined || value.length <= field.maxLength
  );
};

const listFieldSchema = (
  service: TaskServiceName,
  fieldName: string,
  itemSchema: z.ZodTypeAny
) => {
  const field = fieldDefinition(service, fieldName);
  let schema = z.array(itemSchema);
  if (field.minItems !== undefined) schema = schema.min(field.minItems);
  if (field.maxItems !== undefined) schema = schema.max(field.maxItems);
  return field.required ? schema : schema.optional();
};

const equipmentOptions = optionValues("Instalación", "equipment");
const equipmentTypeSchema = z.enum(equipmentOptions);
const equipmentField = fieldDefinition("Instalación", "equipment");
const equipmentItemSchema = z.object({
  type: equipmentTypeSchema,
  quantity: z.number().int().min(equipmentField.minQuantity!).max(equipmentField.maxQuantity!),
}).strict();

const serviceDetailSchemas = {
  "Instalación": z.object({
    equipment: listFieldSchema("Instalación", "equipment", equipmentItemSchema),
    speed: optionFieldSchema("Instalación", "speed"),
    propertyType: optionFieldSchema("Instalación", "propertyType"),
  }).strict(),
  "Reconexión": z.object({
    reason: optionFieldSchema("Reconexión", "reason"),
    availableEquipment: listFieldSchema(
      "Reconexión",
      "availableEquipment",
      optionItemSchema("Reconexión", "availableEquipment")
    ),
  }).strict(),
  "Servicio técnico": z.object({
    problem: optionFieldSchema("Servicio técnico", "problem"),
    affectedEquipment: listFieldSchema(
      "Servicio técnico",
      "affectedEquipment",
      optionItemSchema("Servicio técnico", "affectedEquipment")
    ),
  }).strict(),
  "Desconexión": z.object({
    reason: optionFieldSchema("Desconexión", "reason"),
    equipmentReturn: optionFieldSchema("Desconexión", "equipmentReturn"),
  }).strict(),
};

const taskFields = {
  clientId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  dueDate: dateSchema.optional(),
  description: z.string().trim().min(1),
  priority: z.enum(["Baja", "Media", "Alta"]).optional(),
  status: z.enum(["Vista", "En proceso", "Terminada", "No terminada"]).optional(),
};

const administrativeVariant = <T extends TaskServiceName>(service: T) => z.object({
  ...taskFields,
  service: z.literal(service),
  serviceDetails: serviceDetailSchemas[service].nullable().optional(),
}).strict();

const clientVariant = <T extends TaskServiceName>(service: T) => z.object({
  description: z.string().trim().min(1),
  service: z.literal(service),
  serviceDetails: serviceDetailSchemas[service].nullable().optional(),
}).strict();

const administrativeTaskSchema = z.discriminatedUnion("service", [
  administrativeVariant("Instalación"),
  administrativeVariant("Reconexión"),
  administrativeVariant("Servicio técnico"),
  administrativeVariant("Desconexión"),
]);

const clientRequestSchema = z.discriminatedUnion("service", [
  clientVariant("Instalación"),
  clientVariant("Reconexión"),
  clientVariant("Servicio técnico"),
  clientVariant("Desconexión"),
]);

const operatorCreateSchema = z.object({
  ...taskFields,
  service: z.enum(SERVICE_NAMES),
}).strict();

export type TaskInput = z.infer<typeof administrativeTaskSchema>;
export type ClientTaskRequest = z.infer<typeof clientRequestSchema>;

const getTodayDate = () => new Date().toLocaleDateString("en-CA");

export const parseTaskCreateInput = (body: unknown, role?: string | null): TaskInput | ClientTaskRequest => {
  const normalizedRole = normalizeRole(role);
  const normalizedBody = typeof body === "object" && body !== null && !Array.isArray(body)
    ? { ...(body as Record<string, unknown>) }
    : body;

  if (normalizedBody && typeof normalizedBody === "object") {
    const bodyRecord = normalizedBody as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(bodyRecord, "priority")) {
      bodyRecord.priority = normalizePriorityValue(bodyRecord.priority);
    }
    if (Object.prototype.hasOwnProperty.call(bodyRecord, "status")) {
      bodyRecord.status = normalizeStatusValue(bodyRecord.status);
    }
  }

  if (normalizedRole === "cliente") {
    const result = clientRequestSchema.safeParse(normalizedBody);
    if (!result.success) {
      throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de tarea no válidos");
    }

    const parsed = result.data;
    return {
      ...parsed,
      serviceDetails: parsed.serviceDetails ?? null,
      status: "Vista",
    };
  }

  const result = (normalizedRole === "operador" ? operatorCreateSchema : administrativeTaskSchema)
    .safeParse(normalizedBody);
  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de tarea no válidos");
  }

  const parsed = result.data as TaskInput;
  return {
    ...parsed,
    dueDate: parsed.dueDate ?? getTodayDate(),
    priority: parsed.priority ?? "Baja",
    status: parsed.status ?? "Vista",
    serviceDetails: parsed.serviceDetails ?? null,
  };
};

export const parseTaskUpdateInput = (body: unknown, role?: string | null) => {
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

  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "operador") {
    const updateSchema = z.object({
      dueDate: dateSchema.optional(),
      status: z.enum(["Vista", "En proceso", "Terminada", "No terminada"]).optional(),
    }).strict();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      throw AppError.badRequest(result.error.issues[0]?.message ?? "Datos de actualización no válidos");
    }
    return result.data;
  }

  const normalizedBody = typeof body === "object" && body !== null && !Array.isArray(body)
    ? { ...(body as Record<string, unknown>) }
    : body;
  if (normalizedBody && typeof normalizedBody === "object") {
    const bodyRecord = normalizedBody as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(bodyRecord, "priority")) {
      bodyRecord.priority = normalizePriorityValue(bodyRecord.priority);
    }
    if (Object.prototype.hasOwnProperty.call(bodyRecord, "status")) {
      bodyRecord.status = normalizeStatusValue(bodyRecord.status);
    }
  }

  const result = administrativeTaskSchema.safeParse(normalizedBody);
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
    const payload = parseTaskUpdateInput(req.body, user.role);
    const task = await taskService.update(parseTaskId(req.params.id), payload, user);
    return res.status(200).json({ task });
  }

  if (user && normalizeRole(user.role) === "cliente") {
    const payload = parseTaskUpdateInput(req.body, user.role);
    const task = await taskService.update(parseTaskId(req.params.id), payload, user);
    return res.status(200).json({ task });
  }

  const payload = parseTaskUpdateInput(req.body, user?.role) as Partial<TaskInput>;
  const task = await taskService.update(parseTaskId(req.params.id), payload, user ?? null);
  return res.status(200).json({ task });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await taskService.remove(parseTaskId(req.params.id));
  res.status(200).json({ message: "Tarea eliminada" });
});