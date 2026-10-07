import bcrypt from "bcrypt";
import type { User } from "../modules/user/user.entity.js";

const defaultUsers = [
  { nombre: "Cliente de prueba 1", email: "cliente1@asiinet.com", role: "cliente" },
  { nombre: "Cliente de prueba 2", email: "cliente2@asiinet.com", role: "cliente" },
  { nombre: "Empleado de prueba 1", email: "empleado1@asiinet.com", role: "operador" },
  { nombre: "Empleado de prueba 2", email: "empleado2@asiinet.com", role: "operador" },
] satisfies Pick<User, "nombre" | "email" | "role">[];

type FindUserByEmail = (email: string) => Promise<User | null>;
type SaveUser = (user: Partial<User>) => Promise<User>;

export const ensureDefaultUsers = async (
  findUserByEmail: FindUserByEmail,
  saveUser: SaveUser,
  initialPassword: string
) => {
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  for (const defaultUser of defaultUsers) {
    const existingUser = await findUserByEmail(defaultUser.email);

    if (existingUser) {
      if (existingUser.role !== defaultUser.role) {
        await saveUser({ ...existingUser, role: defaultUser.role });
      }
      continue;
    }

    await saveUser({
      ...defaultUser,
      passwordHash,
    });
  }
};
