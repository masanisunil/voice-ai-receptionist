import type { AppointmentWithDetails } from "../domain/types.js";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { retry } from "../utils/retry.js";
import { logger } from "../config/logger.js";

export class PmsService {
  async syncAppointment(appointment: AppointmentWithDetails): Promise<void> {
    const payload = {
      appointmentId: appointment.id,
      patient: {
        id: appointment.patientId,
        fullName: appointment.patient.fullName,
        phoneE164: appointment.patient.phoneE164
      },
      doctor: {
        id: appointment.doctorId,
        name: appointment.doctor.fullName,
        specialty: appointment.doctor.specialty
      },
      branch: {
        id: appointment.branchId,
        name: appointment.branch.name
      },
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      reason: appointment.reason
    };
    const idempotencyKey = `pms:${appointment.id}:${appointment.idempotencyKey}`;

    const writeback = await prisma.pmsWriteback.upsert({
      where: { idempotencyKey },
      update: { payload, status: "PENDING" },
      create: {
        appointmentId: appointment.id,
        idempotencyKey,
        payload,
        status: "PENDING"
      }
    });

    try {
      const response = await retry(
        async () => {
          const result = await fetch(`${env.PMS_BASE_URL}/appointments`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "idempotency-key": idempotencyKey,
              authorization: `Bearer ${env.PMS_API_KEY ?? "local"}`
            },
            body: JSON.stringify(payload)
          });
          if (!result.ok) {
            throw new Error(`PMS writeback failed with ${result.status}`);
          }
          return (await result.json()) as { externalPmsId: string };
        },
        { attempts: env.PMS_RETRY_ATTEMPTS, baseDelayMs: 150 }
      );

      await prisma.$transaction([
        prisma.pmsWriteback.update({
          where: { id: writeback.id },
          data: { status: "SUCCEEDED", attempts: { increment: 1 }, response }
        }),
        prisma.appointment.update({
          where: { id: appointment.id },
          data: { pmsStatus: "SUCCEEDED", externalPmsId: response.externalPmsId }
        })
      ]);
    } catch (error) {
      logger.error({ error, appointmentId: appointment.id }, "pms_writeback_failed");
      const message = error instanceof Error ? error.message : "Unknown PMS error";
      await prisma.$transaction([
        prisma.pmsWriteback.update({
          where: { id: writeback.id },
          data: {
            status: "FAILED",
            attempts: { increment: 1 },
            lastError: message,
            nextRetryAt: new Date(Date.now() + 5 * 60_000)
          }
        }),
        prisma.appointment.update({
          where: { id: appointment.id },
          data: { pmsStatus: "FAILED" }
        }),
        prisma.pendingFollowup.create({
          data: {
            patientId: appointment.patientId,
            callSessionId: appointment.callSessionId,
            reason: "PMS_FAILURE",
            summary: `Appointment ${appointment.id} is confirmed locally but failed PMS writeback: ${message}`,
            metadata: { appointmentId: appointment.id }
          }
        })
      ]);
    }
  }
}
