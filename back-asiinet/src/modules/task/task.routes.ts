import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import * as taskController from "./task.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", taskController.getAll);
router.post("/", taskController.create);
router.put("/:id", taskController.update);
router.delete("/:id", taskController.remove);

export default router;