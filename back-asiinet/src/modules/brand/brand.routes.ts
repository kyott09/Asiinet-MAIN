import { Router } from "express";
import * as brandController from "./brand.controller.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requirePermission("vehicles:read"), brandController.getAll);
router.get("/:id", requireAuth, requirePermission("vehicles:read"), brandController.getById);
router.post("/", requireAuth, requirePermission("vehicles:write"), brandController.create);
router.put("/:id", requireAuth, requirePermission("vehicles:write"), brandController.update);
router.delete("/:id", requireAuth, requirePermission("vehicles:write"), brandController.remove);

export default router;