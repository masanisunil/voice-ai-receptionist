import type { Request, Response } from "express";
import { AppointmentRepository } from "../repositories/AppointmentRepository.js";
import { SchedulingService } from "../services/SchedulingService.js";
import { NotFoundError, ValidationAppError } from "../errors/AppError.js";

export class AppointmentController {
  constructor(private readonly scheduling = new SchedulingService()) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (typeof id !== "string") throw new ValidationAppError("Appointment id is required.");
    const appointment = await new AppointmentRepository().findById(id);
    if (!appointment) throw new NotFoundError("Appointment not found.");
    res.json({ ok: true, data: { appointment } });
  };

  book = async (req: Request, res: Response): Promise<void> => {
    const appointment = await this.scheduling.book(req.body);
    res.status(201).json({ ok: true, data: { appointment } });
  };

  reschedule = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (typeof id !== "string") throw new ValidationAppError("Appointment id is required.");
    const result = await this.scheduling.reschedule({ ...req.body, appointmentId: id });
    res.json({ ok: true, data: result });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (typeof id !== "string") throw new ValidationAppError("Appointment id is required.");
    const result = await this.scheduling.cancel({ ...req.body, appointmentId: id });
    res.json({ ok: true, data: result });
  };
}
