
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {

  if (err.status === 400) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message
      }
    });
  }

  if (err.status === 404) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: err.message
      }
    });
  }

  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error"
    }
  });

}
