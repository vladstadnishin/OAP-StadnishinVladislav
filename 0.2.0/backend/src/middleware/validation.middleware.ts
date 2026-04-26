import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";
import { ApiError } from "./error-handler.middleware";

interface ValidationConfig {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function mapZodError(error: ZodError) {              // Перетворення помилки Zod у єдиний формат
  return error.issues.map(issue => ({
    field: issue.path.join(".") || undefined,
    message: issue.message
  }));
}

export function validateRequest(config: ValidationConfig) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {                                                                 // Валідація params, query і body до контролера
      if (config.params) {
        req.params = config.params.parse(req.params) as Request["params"];
      }

      if (config.query) {
        req.query = config.query.parse(req.query) as Request["query"];
      }

      if (config.body) {
        req.body = config.body.parse(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {                                                     // Усі помилки валідації до одного формату 400
        next(
          new ApiError(400, "VALIDATION_ERROR", "Invalid request body", mapZodError(error))
        );
        return;
      }

      next(error);
    }
  };
}
