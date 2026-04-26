import { Router } from "express";
import {
  createNameRequestSchema,
  nameParamsSchema,
  namesQuerySchema,
  patchNameRequestSchema,
  updateNameRequestSchema
} from "../dtos/names.dtos";
import type { NamesController } from "../controllers/names.controllers";
import { validateRequest } from "../middleware/validation.middleware";

export function createNamesRouter(controller: NamesController): Router {
  const router = Router();

  router.get("/", validateRequest({ query: namesQuerySchema }), controller.getList);
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
