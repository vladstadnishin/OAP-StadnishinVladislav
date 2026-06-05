import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { ApiError } from "./error-handler.middleware";
import type { UsersRepository } from "../repositories/users.repository";

declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
    }
  }
}

const demoUserIdSchema = z.string().uuid();

function unauthorized(): ApiError {
  return new ApiError(
    401,
    "UNAUTHORIZED",
    "X-Demo-UserId header is required"
  );
}

export function createDemoAuthMiddleware(
  usersRepository: UsersRepository
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const rawUserId = req.header("X-Demo-UserId");

    if (!rawUserId) {
      next(unauthorized());
      return;
    }

    const parsedUserId = demoUserIdSchema.safeParse(rawUserId);

    if (!parsedUserId.success || !usersRepository.findById(parsedUserId.data)) {
      next(unauthorized());
      return;
    }

    // ідентифікація
    req.currentUserId = parsedUserId.data;
    next();
  };
}

export function requireCurrentUserId(req: Request): string {
  if (!req.currentUserId) {
    throw unauthorized();
  }

  return req.currentUserId;
}
