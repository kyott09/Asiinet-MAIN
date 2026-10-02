import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

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
    const decoded = jwt.verify(token, jwtSecret) as {
      id: number;
      email: string;
      role: string;
    };

    (req as AuthenticatedRequest).user = decoded;
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

    if (!allowedRoles.includes(user.role)) {
      return next(AppError.forbidden("No tienes permisos para acceder a este recurso"));
    }

    return next();
  };
};
