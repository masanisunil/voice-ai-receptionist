import type { Appointment, AvailabilityWindow, Branch, Doctor } from "@prisma/client";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { DbClient } from "./types.js";

export type AvailabilityWindowWithDetails = AvailabilityWindow & {
  doctor: Doctor;
  branch: Branch;
};

export class AvailabilityRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findWindows(filters: {
    doctorIds?: string[];
    branchId?: string;
    branchName?: string;
    specialty?: string;
    dayOfWeek?: number;
  }): Promise<AvailabilityWindowWithDetails[]> {
    return this.db.availabilityWindow.findMany({
      where: {
        isActive: true,
        doctorId: filters.doctorIds ? { in: filters.doctorIds } : undefined,
        branchId: filters.branchId,
        dayOfWeek: filters.dayOfWeek,
        doctor: filters.specialty
          ? { specialty: { contains: filters.specialty, mode: "insensitive" }, isActive: true }
          : { isActive: true },
        branch: filters.branchName ? { name: { contains: filters.branchName, mode: "insensitive" } } : undefined
      },
      include: { doctor: true, branch: true },
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }]
    });
  }

  findActiveAppointments(doctorIds: string[], from: Date, to: Date): Promise<Appointment[]> {
    if (doctorIds.length === 0) return Promise.resolve([]);
    return this.db.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        status: { in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] },
        startAt: { lt: to },
        endAt: { gt: from }
      }
    });
  }
}
