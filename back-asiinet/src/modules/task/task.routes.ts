import { Router } from "express";
import type { RequestHandler } from "express";
import { requireAuth, requirePermission, requireTaskAccess } from "../../middlewares/auth.js";
import * as taskController from "./task.controller.js";

type TaskControllers = Pick<typeof taskController, "getAll" | "create" | "update" | "remove">;
type TaskAccessFactory = (action: "read" | "update" | "delete") => RequestHandler;

export const createTaskRouter = (
	auth: RequestHandler = requireAuth,
	taskAccess: TaskAccessFactory = requireTaskAccess,
	controllers: TaskControllers = taskController
) => {
	const router = Router();

	router.get("/", auth, requirePermission("tasks:read"), controllers.getAll);
	router.post("/", auth, requirePermission("tasks:create"), controllers.create);
	router.put("/:id", auth, requirePermission("tasks:update"), taskAccess("update"), controllers.update);
	router.delete("/:id", auth, requirePermission("tasks:delete"), taskAccess("delete"), controllers.remove);

	return router;
};

export default createTaskRouter();