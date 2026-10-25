import { Router } from "express";
import * as vehicleModelController from "./vehicle-model.controller.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requirePermission("vehicles:read"), vehicleModelController.getAll);
router.get("/by-brand/:brandId", requireAuth, requirePermission("vehicles:read"), vehicleModelController.getByBrand);
router.get("/:id", requireAuth, requirePermission("vehicles:read"), vehicleModelController.getById);
router.post("/", requireAuth, requirePermission("vehicles:write"), vehicleModelController.create);
router.put("/:id", requireAuth, requirePermission("vehicles:write"), vehicleModelController.update);
router.delete("/:id", requireAuth, requirePermission("vehicles:write"), vehicleModelController.remove);

export default router;