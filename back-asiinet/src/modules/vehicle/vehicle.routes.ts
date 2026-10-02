import { Router } from "express";
import * as vehicleController from "./vehicle.controller.js";

const router = Router();

router.get("/", vehicleController.getAll);
router.get("/:id", vehicleController.getById);
router.post("/", vehicleController.create);
router.put("/:id", vehicleController.update);
router.delete("/:id", vehicleController.remove);

export default router;