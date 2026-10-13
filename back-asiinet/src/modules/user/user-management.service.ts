import bcrypt from "bcrypt";
import { AppError } from "../../middlewares/errors.js";
import { normalizeRole } from "../../middlewares/auth.js";
import type { User } from "./user.entity.js";
import { userManagementStore } from "./user-management.repository.js";

export interface UserManagementTransaction {
  findByIdForUpdate(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  countTaskAssignments(id: number): Promise<{ client: number; employee: number }>;
  updateUser(id: number, data: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
}

export interface UserManagementStore {
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Partial<User>): Promise<User>;
  withAdminRowsLocked<T>(
    operation: (
      admins: User[],
      transaction: UserManagementTransaction
    ) => Promise<T>
  ): Promise<T>;
}

export interface ManagedUser {
  id: number;
  nombre: string;
  email: string;
  role: string;
  creadoEn: Date;
}

const allowedRoles = new Set(["admin", "supervisor", "operador", "cliente"]);
const createFields = new Set(["nombre", "email", "password", "role"]);
const updateFields = new Set(["nombre", "email", "role"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertAllowedFields = (value: unknown, allowed: Set<string>) => {
  if (!isRecord(value)) {
    throw AppError.badRequest("El cuerpo de la solicitud no es válido");
  }

  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw AppError.badRequest("El cuerpo contiene campos no permitidos");
  }

  return value;
};

const requiredString = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw AppError.badRequest(`El campo ${field} es obligatorio`);
  }

  return value.trim();
};

const validateRole = (value: unknown) => {
  const role = normalizeRole(requiredString(value, "role"));
  if (!allowedRoles.has(role)) {
    throw AppError.badRequest("El rol seleccionado no es válido");
  }

  return role;
};

const validatePassword = (value: unknown) => {
  if (typeof value !== "string") {
    throw AppError.badRequest("La contraseña debe tener entre 8 y 72 bytes");
  }

  const byteLength = Buffer.byteLength(value, "utf8");
  if (byteLength < 8 || byteLength > 72) {
    throw AppError.badRequest("La contraseña debe tener entre 8 y 72 bytes");
  }

  return value;
};

const toManagedUser = (user: User): ManagedUser => ({
  id: user.id,
  nombre: user.nombre || "Usuario",
  email: user.email,
  role: normalizeRole(user.role),
  creadoEn: user.creadoEn,
});

const isDuplicateEmailError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as { code?: unknown; driverError?: { code?: unknown } };
  return candidate.code === "ER_DUP_ENTRY" || candidate.driverError?.code === "ER_DUP_ENTRY";
};

const throwIfDuplicateEmail = (error: unknown): never => {
  if (isDuplicateEmailError(error)) {
    throw AppError.conflict("Ya existe un usuario con ese email");
  }

  throw error;
};

const validateId = (id: number) => {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw AppError.badRequest("Identificador de usuario no válido");
  }
};

export const createUserManagementService = (
  store: UserManagementStore,
  hashPassword: (password: string) => Promise<string> = (password) =>
    bcrypt.hash(password, 10)
) => ({
  async list(): Promise<ManagedUser[]> {
    const users = await store.findAll();
    return users.map(toManagedUser);
  },

  async create(input: unknown): Promise<ManagedUser> {
    const body = assertAllowedFields(input, createFields);
    const nombre = requiredString(body.nombre, "nombre");
    const email = requiredString(body.email, "email");
    const password = validatePassword(body.password);
    const role = validateRole(body.role);

    if (await store.findByEmail(email)) {
      throw AppError.conflict("Ya existe un usuario con ese email");
    }

    const passwordHash = await hashPassword(password);
    try {
      return toManagedUser(await store.create({
        nombre,
        email,
        passwordHash,
        role,
      }));
    } catch (error) {
      return throwIfDuplicateEmail(error);
    }
  },

  async update(id: number, input: unknown, actorId: number): Promise<ManagedUser> {
    validateId(id);
    const body = assertAllowedFields(input, updateFields);
    const updates: Partial<User> = {};

    if (Object.prototype.hasOwnProperty.call(body, "nombre")) {
      updates.nombre = requiredString(body.nombre, "nombre");
    }
    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      updates.email = requiredString(body.email, "email");
    }
    if (Object.prototype.hasOwnProperty.call(body, "role")) {
      updates.role = validateRole(body.role);
    }
    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest("Indicá al menos un campo para actualizar");
    }

    try {
      return await store.withAdminRowsLocked(async (admins, transaction) => {
        const currentUser = await transaction.findByIdForUpdate(id);
        if (!currentUser) {
          throw AppError.notFound("Usuario no encontrado");
        }

        const currentRole = normalizeRole(currentUser.role);
        const nextRole = updates.role ?? currentRole;

        if (
          actorId === id &&
          currentRole === "admin" &&
          nextRole !== "admin"
        ) {
          throw AppError.forbidden("No puedes quitarte el rol de administrador");
        }

        if (
          currentRole === "admin" &&
          nextRole !== "admin" &&
          admins.length <= 1
        ) {
          throw AppError.conflict("No se puede degradar al último administrador");
        }

        if (updates.role && nextRole !== currentRole) {
          const assignments = await transaction.countTaskAssignments(id);
          if (
            (assignments.client > 0 && nextRole !== "cliente") ||
            (assignments.employee > 0 && nextRole !== "operador")
          ) {
            throw AppError.conflict(
              "No se puede cambiar el rol mientras el usuario tenga tareas asignadas con ese rol"
            );
          }
        }

        if (updates.email && updates.email !== currentUser.email) {
          const existing = await transaction.findByEmail(updates.email);
          if (existing && existing.id !== id) {
            throw AppError.conflict("Ya existe un usuario con ese email");
          }
        }

        const updated = await transaction.updateUser(id, updates);
        if (!updated) {
          throw AppError.notFound("Usuario no encontrado");
        }

        return toManagedUser(updated);
      });
    } catch (error) {
      return throwIfDuplicateEmail(error);
    }
  },

  async delete(id: number, actorId: number): Promise<void> {
    validateId(id);
    if (id === actorId) {
      throw AppError.forbidden("No puedes eliminar tu propio usuario");
    }

    await store.withAdminRowsLocked(async (admins, transaction) => {
      const user = await transaction.findByIdForUpdate(id);
      if (!user) {
        throw AppError.notFound("Usuario no encontrado");
      }

      if (normalizeRole(user.role) === "admin" && admins.length <= 1) {
        throw AppError.conflict("No se puede eliminar al último administrador");
      }

      const assignments = await transaction.countTaskAssignments(id);
      if (assignments.client > 0 || assignments.employee > 0) {
        throw AppError.conflict(
          "No se puede eliminar un usuario con tareas asociadas; reasigna las tareas antes de eliminarlo"
        );
      }

      if (!await transaction.deleteUser(id)) {
        throw AppError.notFound("Usuario no encontrado");
      }
    });
  },
});

export const userManagementService = createUserManagementService(userManagementStore);
