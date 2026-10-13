import { Router } from "express";
import * as brandController from "./brand.controller.js";

const router = Router();

router.get("/", brandController.getAll);
router.get("/:id", brandController.getById);
router.post("/", brandController.create);
router.put("/:id", brandController.update);
router.delete("/:id", brandController.remove);

export default router;