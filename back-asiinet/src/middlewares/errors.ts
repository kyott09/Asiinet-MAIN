// Este archivo tiene 3 cosas adentro:
//   1. AppError        -> una clase para "armar" errores con status y código
//   2. notFoundHandler  -> qué hacer cuando piden una ruta que no existe
//   3. errorHandler     -> el que arma la respuesta final que recibe el cliente

import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number; // ej: 404, 401, 500
  public readonly code: string;       // ej: "NOT_FOUND", "UNAUTHORIZED"

  constructor(message: string, statusCode: number, code: string) {
    super(message); // esto le pasa el mensaje al Error normal de JS
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";

    Object.setPrototypeOf(this, AppError.prototype);
  }

  //ATAJOS
  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(message, 400, code);
  }

  static unauthorized(message: string, code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  }

  static forbidden(message: string, code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  static notFound(message: string, code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  static internal(message: string, code = "INTERNAL_SERVER_ERROR") {
    return new AppError(message, 500, code);
  }
}


export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};


export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction // no se usa, pero tiene que estar igual
) => {
  
  //Errores esperados: 
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
  }

  //Error que NO esperábamos
  console.error("Error no controlado:", err);

  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocurrió un error inesperado en el servidor",
  });
};