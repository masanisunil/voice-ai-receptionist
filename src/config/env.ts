import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url().default("http://localhost:8080"),
  CLINIC_TIMEZONE: z.string().default("Asia/Kolkata"),
  REQUEST_ID_HEADER: z.string().default("x-request-id"),
  LOG_LEVEL: z.string().default("info"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1"),
  RETELL_API_KEY: z.string().optional(),
  RETELL_WEBHOOK_SECRET: z.string().optional(),
  RETELL_AGENT_ID: z.string().optional(),
  RETELL_PHONE_NUMBER: z.string().optional(),
  PMS_MODE: z.enum(["mock", "cliniko"]).default("mock"),
  PMS_BASE_URL: z.string().url().default("http://localhost:8080/api/pms/mock"),
  PMS_API_KEY: z.string().optional(),
  PMS_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(8).default(3),
  SAME_DAY_BUFFER_MINUTES: z.coerce.number().int().min(0).default(30),
  RESCHEDULE_FEE_WINDOW_HOURS: z.coerce.number().int().min(0).default(24),
  DROPPED_CALL_RECOVERY_MINUTES: z.coerce.number().int().min(1).default(45),
  MISSED_CALLBACK_RECOVERY_HOURS: z.coerce.number().int().min(1).default(48)
});

export const env = schema.parse(process.env);
