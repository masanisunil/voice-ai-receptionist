import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger.js";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" }
  ]
});

prisma.$on("error", (event) => logger.error(event, "prisma_error"));
prisma.$on("warn", (event) => logger.warn(event, "prisma_warning"));
