import type { ErrorRequestHandler } from "express";

interface ErrorDetail {
  field?: string;
  message: string;
}

class ApiError extends Error {
  statusCode: number;
  code: string;
  details: ErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: ErrorDetail[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function extractFieldFromMessage(message: string): string | undefined {
  // SQLite error messages often mention "table.field", which is enough for API details.
  const match = message.match(/failed:\s*[^.]+\.(\w+)/i);
  return match?.[1];
}

function isSqliteError(error: unknown): error is Error & { code: string } {
  const typedError = error as { code?: unknown } | null;

  return (
    error instanceof Error &&
    typeof typedError?.code === "string" &&
    typedError.code.startsWith("SQLITE_")
  );
}

function mapSqliteError(error: Error & { code: string }): ApiError {
  // We normalize low-level DB errors into predictable HTTP responses for the frontend.
  const field = extractFieldFromMessage(error.message);

  if (error.code.includes("UNIQUE") || error.code.includes("PRIMARYKEY")) {
    return new ApiError(409, "CONFLICT", "Unique constraint failed", [
      {
        field,
        message: "Значення повинно бути унікальним"
      }
    ]);
  }

  if (error.code.includes("FOREIGNKEY")) {
    return new ApiError(
      400,
      "VALIDATION_ERROR",
      "Foreign key constraint failed",
      [
        {
          field,
          message: "Пов'язаний запис не існує або не може бути змінений"
        }
      ]
    );
  }

  if (error.code.includes("NOTNULL")) {
    return new ApiError(400, "VALIDATION_ERROR", "Required field is missing", [
      {
        field,
        message: "Обов'язкове поле відсутнє"
      }
    ]);
  }

  if (error.code.includes("CHECK")) {
    return new ApiError(400, "VALIDATION_ERROR", "Check constraint failed", [
      {
        field,
        message: "Дані не пройшли перевірку обмежень БД"
      }
    ]);
  }

  return new ApiError(400, "VALIDATION_ERROR", "Database constraint failed");
}

function sendApiErrorResponse(
  res: Parameters<ErrorRequestHandler>[2],
  error: ApiError
): void {
  // Новий фронтенд читає code/message/details напряму, але старий формат error теж лишається.
  const payload = {
    code: error.code,
    message: error.message,
    details: error.details
  };

  res.status(error.statusCode).json({
    ...payload,
    error: payload
  });
}

const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    sendApiErrorResponse(res, error);
    return;
  }

  if (isSqliteError(error)) {
    // Constraint violations like UNIQUE / CHECK / FK become 400 or 409 here.
    const mappedError = mapSqliteError(error);

    sendApiErrorResponse(res, mappedError);
    return;
  }

  if (error instanceof SyntaxError) {
    // Broken JSON body should not fall through to a generic 500.
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid JSON body",
      details: [],
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
        details: []
      }
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
    details: [],
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      details: []
    }
  });
};

export { ApiError, errorHandlerMiddleware };
