import { Router } from "express";
import { z } from "zod";
import { PmsMockController } from "../controllers/PmsMockController.js";
import { validateBody } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new PmsMockController();
export const pmsRoutes = Router();

const mockAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  patient: z.object({
    id: z.string(),
    fullName: z.string(),
    phoneE164: z.string()
  }),
  doctor: z.object({
    id: z.string(),
    name: z.string(),
    specialty: z.string()
  }),
  branch: z.object({
    id: z.string(),
    name: z.string()
  }),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().optional().nullable()
});

pmsRoutes.post("/mock/appointments", validateBody(mockAppointmentSchema), asyncHandler(controller.createAppointment));
