import { Request, Response } from "express";
import * as userService from "./user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, nombre } = req.body;
  const user = await userService.register(email, password, role, nombre);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await userService.login(email, password);

  res.cookie("token", result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 1000,
  });

  res.status(201).json(result);
});

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({ message: "Sesión cerrada" });
};

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const profile = await userService.getCurrentUserData(user.id);

  return res.status(200).json({ user: profile });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const { nombre, email, fechaNacimiento, domicilio, fotoPerfil } = req.body;
  const updatedUser = await userService.updateProfile(user.id, {
    nombre,
    email,
    fechaNacimiento,
    domicilio,
    fotoPerfil,
  });

  return res.status(200).json({
    message: "Perfil actualizado",
    user: updatedUser,
  });
});

export const adminOnly = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  return res.status(200).json({
    ok: true,
    message: "Acceso de administrador",
    user,
  });
});

export const getAssignableUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAssignableUsers();
  return res.status(200).json(users);
});