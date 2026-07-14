import type { Request, Response } from "express";
import { PatientService } from "../services/PatientService.js";

export class PatientController {
  constructor(private readonly patients = new PatientService()) {}

  identify = async (req: Request, res: Response): Promise<void> => {
    const result = await this.patients.identify(req.body.phoneE164, req.body.fullName);
    res.json({ ok: true, data: result });
  };
}
