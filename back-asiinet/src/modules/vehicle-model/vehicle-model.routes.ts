import { Router } from "express";
import type { RequestHandler } from "express";
import * as vehicleModelController from "./vehicle-model.controller.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";

type VehicleModelControllers = Pick<typeof vehicleModelController, "getAll" | "getByBrand" | "getById" | "create" | "update" | "remove">;

export const createVehicleModelRouter = (auth: RequestHandler, controllers: VehicleModelControllers) => {
	const router = Router();

	router.get("/", auth, requirePermission("vehicles:read"), controllers.getAll);
	router.get("/by-brand/:brandId", auth, requirePermission("vehicles:read"), controllers.getByBrand);
	router.get("/:id", auth, requirePermission("vehicles:read"), controllers.getById);
	router.post("/", auth, requirePermission("vehicles:write"), controllers.create);
	router.put("/:id", auth, requirePermission("vehicles:write"), controllers.update);
	router.delete("/:id", auth, requirePermission("vehicles:write"), controllers.remove);

	return router;
};

export default createVehicleModelRouter(requireAuth, vehicleModelController);