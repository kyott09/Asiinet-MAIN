import { Router } from "express";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "./event.controller.js";

const router = Router();

router.get("/", requireAuth, requirePermission("calendar:read"), getEvents);
router.post("/", requireAuth, requirePermission("calendar:write"), createEvent);
router.put("/:id", requireAuth, requirePermission("calendar:write"), updateEvent);
router.delete("/:id", requireAuth, requirePermission("calendar:write"), deleteEvent);

export default router;
