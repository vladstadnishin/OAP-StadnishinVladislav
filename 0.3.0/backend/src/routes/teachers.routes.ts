import { Router } from "express";
import {
  createTeacherRequestSchema,
  patchTeacherRequestSchema,
  teacherParamsSchema,
  teachersQuerySchema,
  unsafeTeacherSearchQuerySchema,
  updateTeacherRequestSchema
} from "../dtos/teachers.dtos";
import type { TeachersController } from "../controllers/teachers.controllers";
import { validateRequest } from "../middleware/validation.middleware";

export function createTeachersRouter(controller: TeachersController): Router {
  const router = Router();

  router.get("/", validateRequest({ query: teachersQuerySchema }), controller.getList);
  router.get(
    // This route is intentionally separated from the safe CRUD list.
    "/unsafe-search",
    validateRequest({ query: unsafeTeacherSearchQuerySchema }),
    controller.unsafeSearch
  );
  router.get(
    "/:id",
    validateRequest({ params: teacherParamsSchema }),
    controller.getById
  );
  router.post(
    "/",
    validateRequest({ body: createTeacherRequestSchema }),
    controller.create
  );
  router.put(
    "/:id",
    validateRequest({
      params: teacherParamsSchema,
      body: updateTeacherRequestSchema
    }),
    controller.update
  );
  router.patch(
    "/:id",
    validateRequest({
      params: teacherParamsSchema,
      body: patchTeacherRequestSchema
    }),
    controller.patch
  );
  router.delete(
    "/:id",
    validateRequest({ params: teacherParamsSchema }),
    controller.remove
  );

  return router;
}
