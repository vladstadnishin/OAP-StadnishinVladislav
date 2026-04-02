
import { Router } from "express";
import { notesController } from "../controllers/notes.controller";

const router = Router();

router.get("/", notesController.getAll);             //CRUD
router.get("/:id", notesController.getById);
router.post("/", notesController.create);
router.put("/:id", notesController.update);
router.delete("/:id", notesController.delete);

export default router;
