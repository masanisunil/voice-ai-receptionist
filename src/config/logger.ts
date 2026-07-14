import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "RETELL_API_KEY", "OPENAI_API_KEY", "PMS_API_KEY"],
    remove: true
  }
});
