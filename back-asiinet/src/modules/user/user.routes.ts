import { Router } from "express";
import * as userController from "./user.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", requireAuth, userController.getCurrentUser);
router.put("/me", requireAuth, userController.updateProfile);
router.get("/admin-only", requireAuth, requireRole("admin"), userController.adminOnly);

export default router;
