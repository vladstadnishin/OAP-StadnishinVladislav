import { Router } from "express";
import {
  createNoteRequestSchema,
  noteParamsSchema,
  notesQuerySchema,
  patchNoteRequestSchema,
  updateNoteRequestSchema
} from "../dtos/notes.dtos";
import type { RequestHandler } from "express";
import type { NotesController } from "../controllers/notes.controllers";
import { validateRequest } from "../middleware/validation.middleware";

export function createNotesRouter(
  controller: NotesController,
  demoAuthMiddleware: RequestHandler
): Router {
  const router = Router();

  // Усі нотатки персональні, тому кожен маршрут вимагає навчальний currentUserId.
  router.use(demoAuthMiddleware);

  router.get("/", validateRequest({ query: notesQuerySchema }), controller.getList);
  router.get(
    "/:id",
    validateRequest({ params: noteParamsSchema }),
    controller.getById
  );
  router.post(
    "/",
    validateRequest({ body: createNoteRequestSchema }),
    controller.create
  );
  router.put(
    "/:id",
    validateRequest({ params: noteParamsSchema, body: updateNoteRequestSchema }),
    controller.update
  );
  router.patch(
    "/:id",
    validateRequest({ params: noteParamsSchema, body: patchNoteRequestSchema }),
    controller.patch
  );
  router.delete(
    "/:id",
    validateRequest({ params: noteParamsSchema }),
    controller.remove
  );

  return router;
}
