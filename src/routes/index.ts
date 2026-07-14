import { Router } from "express";
import { appointmentRoutes } from "./appointment.routes.js";
import { availabilityRoutes } from "./availability.routes.js";
import { patientRoutes } from "./patient.routes.js";
import { pmsRoutes } from "./pms.routes.js";
import { voiceRoutes } from "./voice.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/availability", availabilityRoutes);
apiRoutes.use("/appointments", appointmentRoutes);
apiRoutes.use("/patients", patientRoutes);
apiRoutes.use("/voice", voiceRoutes);
apiRoutes.use("/pms", pmsRoutes);
