import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./database/prisma.js";

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "voice_ai_receptionist_started");
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "shutdown_started");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("shutdown_complete");
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
