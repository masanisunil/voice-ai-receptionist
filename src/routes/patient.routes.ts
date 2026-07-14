import { Router } from "express";
import { PatientController } from "../controllers/PatientController.js";
import { validateBody } from "../middlewares/validate.js";
import { identifyPatientSchema } from "../tools/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const controller = new PatientController();
export const patientRoutes = Router();

patientRoutes.post("/identify", validateBody(identifyPatientSchema), asyncHandler(controller.identify));
