import { Router } from "express";
import * as userController from "./user.controller.js";
import * as userManagementController from "./user-management.controller.js";
import { requireAuth, requirePermission, requireRole } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/assignables", requireAuth, requirePermission("users:read"), userController.getAssignableUsers);
router.get("/me", requireAuth, userController.getCurrentUser);
router.put("/me", requireAuth, userController.updateProfile);
router.get("/admin-only", requireAuth, requireRole("admin"), userController.adminOnly);
router.get("/", requireAuth, requirePermission("users:write"), userManagementController.listUsers);
router.post("/", requireAuth, requirePermission("users:write"), userManagementController.createUser);
router.put("/:id", requireAuth, requirePermission("users:write"), userManagementController.updateUser);
router.delete("/:id", requireAuth, requirePermission("users:write"), userManagementController.deleteUser);

export default router;
