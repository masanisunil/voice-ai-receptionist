import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentController.js";
import { validateBody } from "../middlewares/validate.js";
import { bookingRequestSchema, cancellationRequestSchema, rescheduleRequestSchema } from "../tools/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new AppointmentController();
export const appointmentRoutes = Router();

appointmentRoutes.get("/:id", asyncHandler(controller.getById));
appointmentRoutes.post("/", validateBody(bookingRequestSchema), asyncHandler(controller.book));
appointmentRoutes.post("/:id/reschedule", validateBody(rescheduleRequestSchema.omit({ appointmentId: true })), asyncHandler(controller.reschedule));
appointmentRoutes.post("/:id/cancel", validateBody(cancellationRequestSchema.omit({ appointmentId: true })), asyncHandler(controller.cancel));
