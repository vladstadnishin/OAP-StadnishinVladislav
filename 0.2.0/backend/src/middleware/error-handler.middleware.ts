import type { ErrorRequestHandler } from "express";

interface ErrorDetail {
  field?: string;
  message: string;
}

class ApiError extends Error {           //Помилка дозволяє повертати стабільний JSON-формат з кодом
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

const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {                           // Бізнес-помилки і валідація
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  if (error instanceof SyntaxError) {                 // Некоректний JSON у тілі запиту
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
        details: []
      }
    });
    return;
  }

  console.error(error);

  res.status(500).json({                  //Обробник для неочікуваних помилок
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      details: []
    }
  });
};

export { ApiError, errorHandlerMiddleware };
