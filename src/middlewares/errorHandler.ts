import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { logger } from "../config/logger.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const requestId = res.locals.requestId as string | undefined;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId
      }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = error.code === "P2002" ? 409 : 500;
    res.status(status).json({
      ok: false,
      error: {
        code: error.code,
        message: error.code === "P2002" ? "Database uniqueness constraint prevented a duplicate write." : "Database error.",
        requestId
      }
    });
    return;
  }

  logger.error({ error, requestId }, "unhandled_error");
  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error.",
      requestId
    }
  });
}
