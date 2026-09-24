import "dotenv/config";
import "reflect-metadata";

import express from "express";
import cors from "cors";
import { AppDataSource } from "./database/data-source.js";
import userRoutes from "./modules/user/user.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errors.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos conectada");
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Servidor en puerto ${process.env.PORT || 8080}`);
    });
  })
  .catch((err: Error) => {
    console.error("Error al conectar:", err);
    process.exit(1);
  });