import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../modules/user/user.entity.js";
import { Brand } from "../modules/brand/brand.entity.js";
import { VehicleModel } from "../modules/vehicle-model/vehicle-model.entity.js";
import { Vehicle } from "../modules/vehicle/vehicle.entity.js";
import { Task } from "../modules/task/task.entity.js";
import { Event } from "../modules/event/event.entity.js";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  entities: [User, Task, Brand, VehicleModel, Vehicle, Event],
});
