import { Router } from "express";
import { HealthController } from "../controllers/HealthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new HealthController();
export const healthRoutes = Router();

healthRoutes.get("/health", controller.health);
healthRoutes.get("/ready", asyncHandler(controller.ready));
