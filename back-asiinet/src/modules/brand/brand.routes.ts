import { Router } from "express";
import type { RequestHandler } from "express";
import * as brandController from "./brand.controller.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";

type BrandControllers = Pick<typeof brandController, "getAll" | "getById" | "create" | "update" | "remove">;

export const createBrandRouter = (auth: RequestHandler, controllers: BrandControllers) => {
	const router = Router();

	router.get("/", auth, requirePermission("vehicles:read"), controllers.getAll);
	router.get("/:id", auth, requirePermission("vehicles:read"), controllers.getById);
	router.post("/", auth, requirePermission("vehicles:write"), controllers.create);
	router.put("/:id", auth, requirePermission("vehicles:write"), controllers.update);
	router.delete("/:id", auth, requirePermission("vehicles:write"), controllers.remove);

	return router;
};

export default createBrandRouter(requireAuth, brandController);