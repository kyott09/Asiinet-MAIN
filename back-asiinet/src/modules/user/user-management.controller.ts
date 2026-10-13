import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { AppError } from "../../middlewares/errors.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { userManagementService } from "./user-management.service.js";

const getActorId = (req: Request) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    throw AppError.unauthorized("No autenticado");
  }

  return user.id;
};

const getUserId = (req: Request) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw AppError.badRequest("Identificador de usuario no válido");
  }

  return id;
};

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userManagementService.list();
  return res.status(200).json({ users });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userManagementService.create(req.body);
  return res.status(201).json({ user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userManagementService.update(
    getUserId(req),
    req.body,
    getActorId(req)
  );
  return res.status(200).json({ user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userManagementService.delete(getUserId(req), getActorId(req));
  return res.status(200).json({ message: "Usuario eliminado" });
});
