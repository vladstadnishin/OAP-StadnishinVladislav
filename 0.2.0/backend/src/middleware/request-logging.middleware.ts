import type { NextFunction, Request, Response } from "express";

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {                           // Логується метод, URL, статус і час виконання кожного запиту
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
