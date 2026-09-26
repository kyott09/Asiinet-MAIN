import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userRepository from "./user.repository.js";
import { AppError } from "../../middlewares/errors.js";

export const register = async (
  email: string,
  password: string,
  role: string = "user",
  nombre?: string,
  fotoPerfil?: string | null
) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw AppError.conflict("El usuario ya existe");

  const normalizedRole = role === "admin" ? "admin" : "user";
  const normalizedName = (nombre ?? "Usuario").trim() || "Usuario";
  const normalizedPhoto = fotoPerfil?.trim() ? fotoPerfil.trim() : null;
  const passwordHash = await bcrypt.hash(password, 10);

  const created = await userRepository.createUser({
    email,
    nombre: normalizedName,
    passwordHash,
    role: normalizedRole,
    fotoPerfil: normalizedPhoto,
  });

  return {
    id: created.id,
    nombre: created.nombre || "Usuario",
    email: created.email,
    role: created.role || "user",
    fechaNacimiento: created.fechaNacimiento ? created.fechaNacimiento.toISOString().slice(0, 10) : null,
    domicilio: created.domicilio || null,
    fotoPerfil: created.fotoPerfil || null,
  };
};

export const login = async (email: string, password: string) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw AppError.unauthorized("Email incorrecto");
  }

  const passwordCompare = await bcrypt.compare(password, user.passwordHash);

  if (!passwordCompare) {
    throw AppError.unauthorized("Contraseña incorrecta");
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw AppError.internal("JWT_SECRET no está definido");
  }

  const expiresIn = "1h" as const;

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    },
    jwtSecret,
    {
      expiresIn,
    }
  );

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre || "Usuario",
      email: user.email,
      role: user.role || "user",
      fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.toISOString().slice(0, 10) : null,
      domicilio: user.domicilio || null,
      fotoPerfil: user.fotoPerfil || null,
    },
  };
};

export const getCurrentUserData = async (userId: number) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("Usuario no encontrado");
  }

  return {
    id: user.id,
    nombre: user.nombre || "Usuario",
    email: user.email,
    role: user.role || "user",
    fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.toISOString().slice(0, 10) : null,
    domicilio: user.domicilio || null,
    fotoPerfil: user.fotoPerfil || null,
  };
};

export const updateProfile = async (
  userId: number,
  payload: { nombre?: string; email?: string; fechaNacimiento?: string | null; domicilio?: string | null; fotoPerfil?: string | null }
) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (payload.email && payload.email !== user.email) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing && existing.id !== userId) {
      throw AppError.conflict("Ya existe un usuario con ese email");
    }
  }

  const nextName = (payload.nombre ?? user.nombre ?? "Usuario").trim() || "Usuario";
  const nextEmail = payload.email ?? user.email;
  const nextFechaNacimiento = payload.fechaNacimiento ? payload.fechaNacimiento : user.fechaNacimiento ?? null;
  const nextDomicilio = payload.domicilio !== undefined ? (payload.domicilio ?? null) : user.domicilio ?? null;
  const nextFotoPerfil = payload.fotoPerfil !== undefined ? (payload.fotoPerfil?.trim() || null) : user.fotoPerfil ?? null;

  const updatedUser = await userRepository.updateUser(userId, {
    nombre: nextName,
    email: nextEmail,
    fechaNacimiento: nextFechaNacimiento ? new Date(nextFechaNacimiento) : null,
    domicilio: nextDomicilio,
    fotoPerfil: nextFotoPerfil,
  });

  if (!updatedUser) {
    throw AppError.notFound("No se pudo actualizar el usuario");
  }

  return {
    id: updatedUser.id,
    nombre: updatedUser.nombre || "Usuario",
    email: updatedUser.email,
    role: updatedUser.role || "user",
    fechaNacimiento: updatedUser.fechaNacimiento ? updatedUser.fechaNacimiento.toISOString().slice(0, 10) : null,
    domicilio: updatedUser.domicilio || null,
    fotoPerfil: updatedUser.fotoPerfil || null,
  };
};