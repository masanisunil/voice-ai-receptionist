import type { Request, Response } from "express";
import { SchedulingService } from "../services/SchedulingService.js";

export class AvailabilityController {
  constructor(private readonly scheduling = new SchedulingService()) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const slots = await this.scheduling.findAvailability(req.body);
    res.json({ ok: true, data: { slots } });
  };
}
