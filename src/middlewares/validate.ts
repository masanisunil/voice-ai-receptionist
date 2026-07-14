import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationAppError } from "../errors/AppError.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationAppError("Invalid request body.", result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new ValidationAppError("Invalid query parameters.", result.error.flatten()));
      return;
    }
    req.query = result.data as Request["query"];
    next();
  };
}
