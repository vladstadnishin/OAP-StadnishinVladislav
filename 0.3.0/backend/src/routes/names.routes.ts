import { Router } from "express";
import {
  createNameRequestSchema,
  nameParamsSchema,
  namesQuerySchema,
  namesStatsQuerySchema,
  patchNameRequestSchema,
  updateNameRequestSchema
} from "../dtos/names.dtos";
import type { NamesController } from "../controllers/names.controllers";
import { validateRequest } from "../middleware/validation.middleware";

export function createNamesRouter(controller: NamesController): Router {
  const router = Router();

  // Validation runs before the controller, so malformed requests fail consistently.
  router.get("/", validateRequest({ query: namesQuerySchema }), controller.getList);
  router.get(
    "/with-users",
    validateRequest({ query: namesQuerySchema }),
    controller.getWithUsers
  );
  router.get(
    "/stats/by-priority",
    validateRequest({ query: namesStatsQuerySchema }),
    controller.getPriorityStats
  );
  router.get(
    "/:id",
    validateRequest({ params: nameParamsSchema }),
    controller.getById
  );
  router.post(
    "/",
    validateRequest({ body: createNameRequestSchema }),
    controller.create
  );
  router.put(
    "/:id",
    validateRequest({ params: nameParamsSchema, body: updateNameRequestSchema }),
    controller.update
  );
  router.patch(
    "/:id",
    validateRequest({ params: nameParamsSchema, body: patchNameRequestSchema }),
    controller.patch
  );
  router.delete(
    "/:id",
    validateRequest({ params: nameParamsSchema }),
    controller.remove
  );

  return router;
}
