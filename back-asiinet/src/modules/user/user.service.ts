import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userRepository from "./user.repository.js";
import { AppError } from "../../middlewares/errors.js";

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatUserDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return toLocalDateString(date);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return toLocalDateString(value);
  }

  return null;
};

export const normalizeDateOnlyValue = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return toLocalDateString(parsed);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return toLocalDateString(value);
  }

  return null;
};

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
    fechaNacimiento: formatUserDate(created.fechaNacimiento),
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
      fechaNacimiento: formatUserDate(user.fechaNacimiento),
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
    fechaNacimiento: formatUserDate(user.fechaNacimiento),
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
  const nextFechaNacimiento = payload.fechaNacimiento !== undefined ? normalizeDateOnlyValue(payload.fechaNacimiento) : normalizeDateOnlyValue(user.fechaNacimiento);
  const nextDomicilio = payload.domicilio !== undefined ? (payload.domicilio ?? null) : user.domicilio ?? null;
  const nextFotoPerfil = payload.fotoPerfil !== undefined ? (payload.fotoPerfil?.trim() || null) : user.fotoPerfil ?? null;

  const updatedUser = await userRepository.updateUser(userId, {
    nombre: nextName,
    email: nextEmail,
    fechaNacimiento: nextFechaNacimiento,
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
    fechaNacimiento: formatUserDate(updatedUser.fechaNacimiento),
    domicilio: updatedUser.domicilio || null,
    fotoPerfil: updatedUser.fotoPerfil || null,
  };
};

export const getAssignableUsers = async () => {
  const [clients, employees] = await Promise.all([
    userRepository.findByRole("cliente"),
    userRepository.findByRole("empleado"),
  ]);

  return {
    clients: clients.map((user) => ({ id: user.id, nombre: user.nombre || "Usuario", email: user.email })),
    employees: employees.map((user) => ({ id: user.id, nombre: user.nombre || "Usuario", email: user.email })),
  };
};