import { Router } from "express";
import { requireAuth, requirePermission, requireTaskAccess } from "../../middlewares/auth.js";
import * as taskController from "./task.controller.js";

const router = Router();

router.get("/", requireAuth, requirePermission("tasks:read"), taskController.getAll);
router.post("/", requireAuth, requirePermission("tasks:create"), taskController.create);
router.put("/:id", requireAuth, requirePermission("tasks:update"), requireTaskAccess("update"), taskController.update);
router.delete("/:id", requireAuth, requirePermission("tasks:delete"), requireTaskAccess("delete"), taskController.remove);

export default router;