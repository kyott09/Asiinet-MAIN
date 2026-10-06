import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findById as findTaskById } from "../modules/task/task.repository.js";
import { AppError } from "./errors.js";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const ROLE_ALIASES: Record<string, string> = {
  user: "cliente",
  cliente: "cliente",
  client: "cliente",
  empleado: "operador",
  employee: "operador",
  operador: "operador",
  admin: "admin",
  supervisor: "supervisor",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "users:read",
    "users:write",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
    "gallery:read",
  ],
  supervisor: [
    "users:read",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "gallery:read",
  ],
  operador: [
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "gallery:read",
  ],
  cliente: [
    "users:read",
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "gallery:read",
  ],
};

export const normalizeRole = (role?: string | null) => {
  const normalized = (role ?? "cliente").trim().toLowerCase();

  if (!normalized) {
    return "cliente";
  }

  return ROLE_ALIASES[normalized] ?? normalized;
};

export const hasPermission = (role: string | undefined, permission: string) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") {
    return true;
  }

  return (ROLE_PERMISSIONS[normalizedRole] ?? []).includes(permission);
};

export const canAccessTask = (
  user: Pick<AuthenticatedUser, "id" | "role"> | null | undefined,
  task: { clientId?: number | null; employeeId?: number | null } | null | undefined,
  action: "read" | "update" | "delete" = "read"
) => {
  if (!user || !task) {
    return false;
  }

  const normalizedRole = normalizeRole(user.role);

  if (normalizedRole === "admin") {
    return true;
  }

  if (normalizedRole === "supervisor") {
    return action !== "delete";
  }

  if (normalizedRole === "operador") {
    if (action === "read") {
      return task.employeeId === user.id || task.clientId === user.id;
    }

    return task.employeeId === user.id;
  }

  if (normalizedRole === "cliente") {
    if (action === "read") {
      return task.clientId === user.id;
    }

    return task.clientId === user.id;
  }

  return false;
};

const getTokenFromCookies = (req: Request) => {
  const rawCookies = req.headers.cookie ?? "";
  const cookies: Record<string, string> = {};

  rawCookies.split(";").forEach((cookie) => {
    const [key, ...rest] = cookie.trim().split("=");
    if (!key) return;
    cookies[key] = decodeURIComponent(rest.join("="));
  });

  return cookies.token ?? null;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromCookies(req);

  if (!token) {
    return next(AppError.unauthorized("Token no proporcionado"));
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    return next(AppError.internal("JWT_SECRET no está definido"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;

    (req as AuthenticatedRequest).user = {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
    return next();
  } catch {
    return next(AppError.unauthorized("Token inválido o expirado"));
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(AppError.unauthorized("No autenticado"));
    }

    const normalizedUserRole = normalizeRole(user.role);
    const allowedSet = new Set(allowedRoles.map((role) => normalizeRole(role)));

    if (!allowedSet.has(normalizedUserRole)) {
      return next(AppError.forbidden("No tienes permisos para acceder a este recurso"));
    }

    return next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(AppError.unauthorized("No autenticado"));
    }

    const missingPermission = permissions.find((permission) => !hasPermission(user.role, permission));

    if (missingPermission) {
      return next(AppError.forbidden("No tienes permisos para acceder a este recurso"));
    }

    return next();
  };
};

export const requireTaskAccess = (action: "read" | "update" | "delete") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(AppError.unauthorized("No autenticado"));
    }

    const rawTaskId = req.params.id;
    const taskId = Number(rawTaskId);

    if (!Number.isSafeInteger(taskId) || taskId < 1) {
      return next(AppError.badRequest("Identificador de tarea no válido"));
    }

    const task = await findTaskById(taskId);

    if (!task) {
      return next(AppError.notFound("Tarea no encontrada"));
    }

    if (!canAccessTask(user, task, action)) {
      return next(AppError.forbidden("No tienes permisos para acceder a esta tarea"));
    }

    (req as AuthenticatedRequest & { task?: typeof task }).task = task;
    return next();
  };
};
