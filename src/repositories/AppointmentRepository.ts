import type { Appointment, Prisma } from "@prisma/client";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { AppointmentWithDetails } from "../domain/types.js";
import type { DbClient } from "./types.js";

export class AppointmentRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(id: string): Promise<AppointmentWithDetails | null> {
    return this.db.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true, branch: true }
    });
  }

  findByIdempotencyKey(idempotencyKey: string): Promise<AppointmentWithDetails | null> {
    return this.db.appointment.findUnique({
      where: { idempotencyKey },
      include: { patient: true, doctor: true, branch: true }
    });
  }

  findActiveConflict(doctorId: string, startAt: Date, endAt: Date): Promise<Appointment | null> {
    return this.db.appointment.findFirst({
      where: {
        doctorId,
        status: { in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] },
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      },
      orderBy: { startAt: "asc" }
    });
  }

  create(data: Prisma.AppointmentCreateInput): Promise<AppointmentWithDetails> {
    return this.db.appointment.create({
      data,
      include: { patient: true, doctor: true, branch: true }
    });
  }

  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<AppointmentWithDetails> {
    return this.db.appointment.update({
      where: { id },
      data,
      include: { patient: true, doctor: true, branch: true }
    });
  }
}
