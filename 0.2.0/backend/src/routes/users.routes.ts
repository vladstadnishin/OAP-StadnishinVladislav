import { Router } from "express";
import {
  createUserRequestSchema,
  patchUserRequestSchema,
  updateUserRequestSchema,
  userParamsSchema,
  usersQuerySchema
} from "../dtos/users.dtos";
import type { UsersController } from "../controllers/users.controllers";
import { validateRequest } from "../middleware/validation.middleware";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get("/", validateRequest({ query: usersQuerySchema }), controller.getList);
  router.get(
    "/:id",
    validateRequest({ params: userParamsSchema }),
    controller.getById
  );
  router.post(
    "/",
    validateRequest({ body: createUserRequestSchema }),
    controller.create
  );
  router.put(
    "/:id",
    validateRequest({ params: userParamsSchema, body: updateUserRequestSchema }),
    controller.update
  );
  router.patch(
    "/:id",
    validateRequest({ params: userParamsSchema, body: patchUserRequestSchema }),
    controller.patch
  );
  router.delete(
    "/:id",
    validateRequest({ params: userParamsSchema }),
    controller.remove
  );

  return router;
}
