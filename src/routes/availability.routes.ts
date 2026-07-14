import { Router } from "express";
import { AvailabilityController } from "../controllers/AvailabilityController.js";
import { validateBody } from "../middlewares/validate.js";
import { availabilityRequestSchema } from "../tools/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new AvailabilityController();
export const availabilityRoutes = Router();

availabilityRoutes.post("/search", validateBody(availabilityRequestSchema), asyncHandler(controller.search));
