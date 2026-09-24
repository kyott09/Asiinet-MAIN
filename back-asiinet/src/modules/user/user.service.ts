import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userRepository from "./user.repository.js";
import { AppError } from "../../middlewares/errors.js";
  

export const register = async (email: string, password: string, role: string = "user") => {
  //Buscar usuario por email
  const existing = await userRepository.findByEmail(email);
  if (existing) throw AppError.conflict("El usuario ya existe");

  const normalizedRole = role === "admin" ? "admin" : "user";
  const passwordHash = await bcrypt.hash(password, 10);

  return userRepository.createUser({ email, passwordHash, role: normalizedRole });
};


export const login = async (email: string, password: string) => {
  //Buscar usuario por email
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw AppError.unauthorized("Email incorrecto");
  }

  //Se comparan la constraseña ingresada, con la registrada en la db
  const passwordCompare = await bcrypt.compare(password, user.passwordHash);

  if (!passwordCompare) {
    throw AppError.unauthorized("Contraseña incorrecta");
  }


  // Generar JWT
  const jwtSecret = process.env.JWT_SECRET;
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


  //Retornar los datos del usuario
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    },
  };

};