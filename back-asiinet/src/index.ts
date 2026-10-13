import "dotenv/config";
import "reflect-metadata";

import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database/data-source.js";
import { User } from "./modules/user/user.entity.js";
import { ensureDefaultUsers } from "./database/seed-default-users.js";
import userRoutes from "./modules/user/user.routes.js";
import taskRoutes from "./modules/task/task.routes.js";
import brandRoutes from "./modules/brand/brand.routes.js";
import vehicleModelRoutes from "./modules/vehicle-model/vehicle-model.routes.js";
import vehicleRoutes from "./modules/vehicle/vehicle.routes.js";
import eventRoutes from "./modules/event/event.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errors.js";

const app = express();
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

const ensureDefaultAdmin = async () => {
  const repo = AppDataSource.getRepository(User);
  const existingAdmin = await repo.findOneBy({ email: "admin@asiinet.com" });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(getInitialAccountsPassword(), 10);

    await repo.save(
      repo.create({
        nombre: "Admin",
        email: "admin@asiinet.com",
        passwordHash,
        role: "admin",
      })
    );

    console.log("Usuario administrador inicial creado");
  }
};

const getInitialAccountsPassword = () => {
  const password = process.env.INITIAL_ACCOUNTS_PASSWORD?.trim();

  if (process.env.NODE_ENV === "production" && (!password || password === "123456")) {
    throw new Error(
      "Configura INITIAL_ACCOUNTS_PASSWORD con una contraseña segura antes de iniciar en producción"
    );
  }

  return password || "123456";
};

const ensureDefaultDemoUsers = async () => {
  const repo = AppDataSource.getRepository(User);

  await ensureDefaultUsers(
    (email) => repo.findOneBy({ email }),
    (user) => repo.save(repo.create(user)),
    getInitialAccountsPassword()
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("No autorizado por CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/vehicle-models", vehicleModelRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/events", eventRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

AppDataSource.initialize()
  .then(async () => {
    console.log("Base de datos conectada");
    await ensureDefaultAdmin();
    await ensureDefaultDemoUsers();
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Servidor en puerto ${process.env.PORT || 8080}`);
    });
  })
  .catch((err: Error) => {
    console.error("Error al conectar:", err);
    process.exit(1);
  });