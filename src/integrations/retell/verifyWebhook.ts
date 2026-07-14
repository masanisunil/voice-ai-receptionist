import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { ValidationAppError } from "../../errors/AppError.js";

export const verifyRetellWebhook: RequestHandler = (req, _res, next) => {
  if (!env.RETELL_WEBHOOK_SECRET) {
    next();
    return;
  }

  const signature = req.header("x-retell-signature");
  const timestamp = req.header("x-retell-timestamp");
  if (!signature || !timestamp) {
    next(new ValidationAppError("Missing Retell webhook signature."));
    return;
  }

  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expected = crypto.createHmac("sha256", env.RETELL_WEBHOOK_SECRET).update(payload).digest("hex");
  if (signature.length !== expected.length) {
    next(new ValidationAppError("Invalid Retell webhook signature."));
    return;
  }
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    next(new ValidationAppError("Invalid Retell webhook signature."));
    return;
  }
  next();
};
