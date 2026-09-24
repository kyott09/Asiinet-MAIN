import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve un controlador async. Si la promesa rechaza (por ejemplo,
 * porque el service lanzó un AppError), automáticamente llama a
 * next(error) en vez de que el error quede "colgado" y tumbe el proceso.
 * Así los controladores no necesitan try/catch manual.
 */

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };