import { Router } from "express";
import { VoiceController } from "../controllers/VoiceController.js";
import { validateBody } from "../middlewares/validate.js";
import {
  availabilityRequestSchema,
  bookingRequestSchema,
  callEventSchema,
  cancellationRequestSchema,
  escalationSchema,
  identifyPatientSchema,
  recordTurnSchema,
  rescheduleRequestSchema,
  startCallSchema
} from "../tools/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new VoiceController();
export const voiceRoutes = Router();

voiceRoutes.post("/tools/identify", validateBody(identifyPatientSchema), asyncHandler(controller.identify));
voiceRoutes.post("/tools/availability", validateBody(availabilityRequestSchema), asyncHandler(controller.availability));
voiceRoutes.post("/tools/book", validateBody(bookingRequestSchema), asyncHandler(controller.book));
voiceRoutes.post("/tools/reschedule", validateBody(rescheduleRequestSchema), asyncHandler(controller.reschedule));
voiceRoutes.post("/tools/cancel", validateBody(cancellationRequestSchema), asyncHandler(controller.cancel));
voiceRoutes.post("/tools/start-call", validateBody(startCallSchema), asyncHandler(controller.startCall));
voiceRoutes.post("/tools/record-turn", validateBody(recordTurnSchema), asyncHandler(controller.recordTurn));
voiceRoutes.post("/tools/call-event", validateBody(callEventSchema), asyncHandler(controller.callEvent));
voiceRoutes.post("/tools/escalate", validateBody(escalationSchema), asyncHandler(controller.escalate));
