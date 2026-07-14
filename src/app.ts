import express from "express";
import helmet from "helmet";
import type { Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { apiRoutes } from "./routes/index.js";
import { healthRoutes } from "./routes/health.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (_req: Request, res: Response) => ({ requestId: res.locals.requestId })
    })
  );

  app.use(healthRoutes);
  app.use("/api", apiRoutes);
  app.use(errorHandler);
  return app;
}
