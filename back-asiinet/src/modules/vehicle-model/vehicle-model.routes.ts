import { Router } from "express";
import * as vehicleModelController from "./vehicle-model.controller.js";

const router = Router();

router.get("/", vehicleModelController.getAll);
router.get("/by-brand/:brandId", vehicleModelController.getByBrand);
router.get("/:id", vehicleModelController.getById);
router.post("/", vehicleModelController.create);
router.put("/:id", vehicleModelController.update);
router.delete("/:id", vehicleModelController.remove);

export default router;