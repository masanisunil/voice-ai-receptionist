import { addMinutes } from "date-fns";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import type { AppointmentWithDetails, BookingInput, CancellationInput, RescheduleInput, Slot } from "../domain/types.js";
import { ConflictError, NotFoundError, ValidationAppError } from "../errors/AppError.js";
import { AppointmentRepository } from "../repositories/AppointmentRepository.js";
import { AuditRepository } from "../repositories/AuditRepository.js";
import { DoctorRepository } from "../repositories/DoctorRepository.js";
import { PatientRepository } from "../repositories/PatientRepository.js";
import { AvailabilityService } from "./AvailabilityService.js";
import { PatientService } from "./PatientService.js";
import { PmsService } from "./PmsService.js";
import { isWithinFeeWindow, overlaps } from "../utils/time.js";
import { normalizeName } from "../utils/text.js";
import { normalizePhoneE164 } from "../utils/phone.js";

export class SchedulingService {
  constructor(
    private readonly availabilityService = new AvailabilityService(),
    private readonly pmsService = new PmsService()
  ) {}

  async findAvailability(input: Parameters<AvailabilityService["search"]>[0]): Promise<Slot[]> {
    return this.availabilityService.search(input);
  }

  async book(input: BookingInput): Promise<AppointmentWithDetails> {
    if (!input.patientFullName.trim()) {
      throw new ValidationAppError("The caller's full name is required before booking.");
    }

    const existing = await new AppointmentRepository().findByIdempotencyKey(input.idempotencyKey);
    if (existing) return existing;
    const phoneE164 = normalizePhoneE164(input.phoneE164);

    const exactSlot = await this.resolveExactSlot(input.doctorId, input.branchId, input.startAt);
    if (!exactSlot) {
      const alternatives = await this.findAvailability({
        from: input.startAt,
        to: addMinutes(input.startAt, 7 * 24 * 60),
        doctorId: input.doctorId,
        branchId: input.branchId,
        limit: 3
      });
      throw new ConflictError("Requested slot is no longer available.", { alternatives });
    }

    let appointment: AppointmentWithDetails;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        const patients = new PatientRepository(tx);
        let patient = await patients.findByPhoneAndName(phoneE164, normalizeName(input.patientFullName));
        if (!patient) {
          patient = await patients.create({
            fullName: input.patientFullName.trim(),
            normalizedName: normalizeName(input.patientFullName),
            phoneE164,
            languagePreference: input.language
          });
        }

        const conflict = await tx.appointment.findFirst({
          where: {
            doctorId: input.doctorId,
            status: { in: ["HELD", "CONFIRMED"] },
            startAt: { lt: addMinutes(exactSlot.endAt, exactSlot.bufferMinutes) },
            endAt: { gt: addMinutes(exactSlot.startAt, -exactSlot.bufferMinutes) }
          }
        });
        if (conflict) {
          throw new ConflictError("Another appointment already occupies that slot.", { conflictId: conflict.id });
        }

        const appointments = new AppointmentRepository(tx);
        const audits = new AuditRepository(tx);
        const created = await appointments.create({
          patient: { connect: { id: patient.id } },
          doctor: { connect: { id: input.doctorId } },
          branch: { connect: { id: input.branchId } },
          callSession: input.callSessionId ? { connect: { id: input.callSessionId } } : undefined,
          startAt: exactSlot.startAt,
          endAt: exactSlot.endAt,
          status: "CONFIRMED",
          reason: input.reason,
          language: input.language,
          idempotencyKey: input.idempotencyKey,
          metadata: { bookedBy: "voice-agent", slotBufferMinutes: exactSlot.bufferMinutes }
        });

        await audits.create({
          actorType: "voice-agent",
          entityType: "Appointment",
          entityId: created.id,
          action: "book",
          after: {
            patientId: patient.id,
            doctorId: input.doctorId,
            branchId: input.branchId,
            startAt: exactSlot.startAt
          }
        });
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("That slot was just booked by another caller. I need to offer a fresh live option.");
      }
      throw error;
    }

    await this.pmsService.syncAppointment(appointment);
    return (await new AppointmentRepository().findById(appointment.id)) ?? appointment;
  }

  async reschedule(input: RescheduleInput): Promise<{ appointment: AppointmentWithDetails; feeApplies: boolean }> {
    const original = await new AppointmentRepository().findById(input.appointmentId);
    if (!original) throw new NotFoundError("Appointment not found.");
    if (original.status !== "CONFIRMED") throw new ValidationAppError("Only confirmed appointments can be rescheduled.");

    const exactSlot = await this.resolveExactSlot(input.newDoctorId, input.newBranchId, input.newStartAt);
    if (!exactSlot) {
      throw new ConflictError("The requested new slot is not available.");
    }

    const feeApplies = isWithinFeeWindow(original.startAt, new Date(), env.RESCHEDULE_FEE_WINDOW_HOURS);
    const replacement = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: input.newDoctorId,
          status: { in: ["HELD", "CONFIRMED"] },
          startAt: { lt: addMinutes(exactSlot.endAt, exactSlot.bufferMinutes) },
          endAt: { gt: addMinutes(exactSlot.startAt, -exactSlot.bufferMinutes) },
          id: { not: original.id }
        }
      });
      if (conflict) throw new ConflictError("The new slot was taken during rescheduling.", { conflictId: conflict.id });

      await tx.appointment.update({
        where: { id: original.id },
        data: { status: "RESCHEDULED" }
      });

      const appointments = new AppointmentRepository(tx);
      const created = await appointments.create({
        patient: { connect: { id: original.patientId } },
        doctor: { connect: { id: input.newDoctorId } },
        branch: { connect: { id: input.newBranchId } },
        callSession: input.callSessionId ? { connect: { id: input.callSessionId } } : undefined,
        source: { connect: { id: original.id } },
        startAt: exactSlot.startAt,
        endAt: exactSlot.endAt,
        status: "CONFIRMED",
        reason: original.reason,
        language: input.language ?? original.language,
        idempotencyKey: input.idempotencyKey,
        cancellationFeeMentioned: feeApplies,
        metadata: { rescheduledFrom: original.id, feeApplies }
      });

      await new AuditRepository(tx).create({
        actorType: "voice-agent",
        entityType: "Appointment",
        entityId: original.id,
        action: "reschedule",
        before: { startAt: original.startAt, doctorId: original.doctorId, branchId: original.branchId },
        after: { appointmentId: created.id, startAt: created.startAt, feeApplies }
      });
      return created;
    });

    await this.pmsService.syncAppointment(replacement);
    return { appointment: (await new AppointmentRepository().findById(replacement.id)) ?? replacement, feeApplies };
  }

  async cancel(input: CancellationInput): Promise<{ appointment: AppointmentWithDetails; feeApplies: boolean }> {
    const existing = await new AppointmentRepository().findById(input.appointmentId);
    if (!existing) throw new NotFoundError("Appointment not found.");
    if (existing.status !== "CONFIRMED") throw new ValidationAppError("Only confirmed appointments can be cancelled.");

    const feeApplies = isWithinFeeWindow(existing.startAt, new Date(), env.RESCHEDULE_FEE_WINDOW_HOURS);
    const cancelled = await prisma.$transaction(async (tx) => {
      const appointments = new AppointmentRepository(tx);
      const updated = await appointments.update(existing.id, {
        status: "CANCELLED",
        cancellationFeeMentioned: feeApplies,
        metadata: { cancelReason: input.reason, feeApplies }
      });
      await new AuditRepository(tx).create({
        actorType: "voice-agent",
        entityType: "Appointment",
        entityId: existing.id,
        action: "cancel",
        before: { status: existing.status },
        after: { status: "CANCELLED", feeApplies }
      });
      return updated;
    });

    return { appointment: cancelled, feeApplies };
  }

  private async resolveExactSlot(doctorId: string, branchId: string, startAt: Date): Promise<Slot | null> {
    const doctor = await new DoctorRepository().findById(doctorId);
    if (!doctor) throw new NotFoundError("Doctor not found.");

    const slots = await this.findAvailability({
      from: addMinutes(startAt, -1),
      to: addMinutes(startAt, 24 * 60),
      doctorId,
      branchId,
      limit: 32
    });

    return slots.find((slot) => slot.startAt.getTime() === startAt.getTime() && !overlaps(startAt, startAt, slot.startAt, slot.endAt)) ?? null;
  }
}
