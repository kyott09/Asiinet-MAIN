import { Router } from "express";
import * as vehicleController from "./vehicle.controller.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requirePermission("vehicles:read"), vehicleController.getAll);
router.get("/:id", requireAuth, requirePermission("vehicles:read"), vehicleController.getById);
router.post("/", requireAuth, requirePermission("vehicles:write"), vehicleController.create);
router.put("/:id", requireAuth, requirePermission("vehicles:write"), vehicleController.update);
router.delete("/:id", requireAuth, requirePermission("vehicles:write"), vehicleController.remove);

export default router;