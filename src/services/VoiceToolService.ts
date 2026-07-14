import { randomUUID } from "node:crypto";
import { addDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { HUMAN_FOLLOWUP_MESSAGE } from "../domain/constants.js";
import type { ToolResponse } from "../domain/types.js";
import { AppError } from "../errors/AppError.js";
import { CallSessionRepository } from "../repositories/CallSessionRepository.js";
import { PatientService } from "./PatientService.js";
import { SchedulingService } from "./SchedulingService.js";
import { CallSessionService } from "./CallSessionService.js";
import { formatSlotForVoice } from "../utils/time.js";
import { env } from "../config/env.js";
import type {
  AvailabilityRequest,
  BookingRequest,
  CancellationRequest,
  RescheduleRequest
} from "../tools/schemas.js";

export class VoiceToolService {
  constructor(
    private readonly scheduling = new SchedulingService(),
    private readonly patientService = new PatientService(),
    private readonly callSessions = new CallSessionService()
  ) {}

  async identify(input: { phoneE164: string; fullName?: string }) {
    const result = await this.patientService.identify(input.phoneE164, input.fullName);
    if (result.status === "identified") {
      return {
        ok: true,
        userMessage: `I found the patient record for ${result.patient.fullName}. I will still confirm the full name before booking.`,
        data: result
      };
    }
    if (result.status === "returning_needs_name") {
      return {
        ok: true,
        userMessage: `I found a returning patient record on this phone. Please ask the caller to say their full name before booking.`,
        data: result
      };
    }
    if (result.status === "ambiguous") {
      return {
        ok: true,
        userMessage:
          "I found more than one patient on this phone number. Please ask for the caller's full name first so we choose the right patient.",
        data: result
      };
    }
    return {
      ok: true,
      userMessage: "I do not see an existing patient for this phone number. Please capture the caller's full name before booking.",
      data: result
    };
  }

  async searchAvailability(input: AvailabilityRequest): Promise<ToolResponse<{ slots: unknown[] }>> {
    const slots = await this.scheduling.findAvailability(input);
    if (slots.length === 0) {
      return {
        ok: true,
        userMessage: "I checked live availability and do not see a matching slot. Ask whether another branch, doctor, or time window works.",
        data: { slots }
      };
    }
    const spoken = slots
      .slice(0, 3)
      .map((slot) => `${formatSlotForVoice(slot.startAt, slot.endAt, env.CLINIC_TIMEZONE)} with ${slot.doctorName} at ${slot.branchName}`)
      .join("; ");
    return {
      ok: true,
      userMessage: `I checked live availability. Available options: ${spoken}. Confirm exactly one option before booking.`,
      data: { slots }
    };
  }

  async book(input: BookingRequest): Promise<ToolResponse<unknown>> {
    const appointment = await this.scheduling.book(input);
    return {
      ok: true,
      userMessage: `Confirmed for ${appointment.patient.fullName} with ${appointment.doctor.spokenName} at ${appointment.branch.name}, ${formatSlotForVoice(
        appointment.startAt,
        appointment.endAt,
        appointment.branch.timezone
      )}.`,
      data: { appointment }
    };
  }

  async reschedule(input: RescheduleRequest): Promise<ToolResponse<unknown>> {
    const { appointment, feeApplies } = await this.scheduling.reschedule(input);
    const feeLine = feeApplies ? " The clinic policy may apply a short-notice rescheduling fee." : "";
    return {
      ok: true,
      userMessage: `Rescheduled to ${formatSlotForVoice(appointment.startAt, appointment.endAt, appointment.branch.timezone)} with ${
        appointment.doctor.spokenName
      } at ${appointment.branch.name}.${feeLine}`,
      data: { appointment, feeApplies }
    };
  }

  async cancel(input: CancellationRequest): Promise<ToolResponse<unknown>> {
    const { appointment, feeApplies } = await this.scheduling.cancel(input);
    const feeLine = feeApplies ? " The clinic policy may apply a short-notice cancellation fee." : "";
    return {
      ok: true,
      userMessage: `Cancelled the appointment for ${appointment.patient.fullName} on ${formatSlotForVoice(
        appointment.startAt,
        appointment.endAt,
        appointment.branch.timezone
      )}.${feeLine}`,
      data: { appointment, feeApplies }
    };
  }

  async startCall(input: { phoneE164: string; retellCallId?: string; direction?: "INBOUND" | "OUTBOUND"; language?: string; intent?: string }) {
    const result = await this.callSessions.startOrResume({
      phone: input.phoneE164,
      retellCallId: input.retellCallId,
      direction: input.direction,
      language: input.language,
      intent: input.intent
    });
    return { ok: true, userMessage: result.userMessage, data: result };
  }

  async recordTurn(input: {
    callSessionId: string;
    role: string;
    transcript?: string;
    language?: string;
    toolName?: string;
    payload?: unknown;
    latencyMs?: number;
  }) {
    const message = await this.callSessions.recordTurn(input);
    return { ok: true, userMessage: "Turn recorded.", data: { messageId: message.id } };
  }

  async handleCallEvent(input: {
    callSessionId?: string;
    phoneE164?: string;
    event: "call_started" | "call_dropped" | "call_ended" | "outbound_no_answer";
    retellCallId?: string;
    language?: string;
    context?: Record<string, unknown>;
  }) {
    if (input.event === "call_started") {
      if (!input.phoneE164) throw new AppError("phoneE164 is required for call_started.", 400, "VALIDATION_ERROR");
      return this.startCall({
        phoneE164: input.phoneE164,
        retellCallId: input.retellCallId,
        language: input.language
      });
    }
    if (input.event === "call_dropped") {
      if (!input.callSessionId) throw new AppError("callSessionId is required for call_dropped.", 400, "VALIDATION_ERROR");
      await this.callSessions.markDropped(input.callSessionId);
      return { ok: true, userMessage: "Dropped call saved for recovery.", data: { callSessionId: input.callSessionId } };
    }
    if (input.event === "call_ended") {
      if (!input.callSessionId) throw new AppError("callSessionId is required for call_ended.", 400, "VALIDATION_ERROR");
      await this.callSessions.complete(input.callSessionId);
      return { ok: true, userMessage: "Call completed.", data: { callSessionId: input.callSessionId } };
    }
    if (!input.phoneE164) throw new AppError("phoneE164 is required for outbound_no_answer.", 400, "VALIDATION_ERROR");
    const callback = await new CallSessionRepository().createCallback({
      phoneE164: input.phoneE164,
      status: "MISSED",
      reason: "Outbound call unanswered",
      missedAt: new Date(),
      context: input.context as Prisma.InputJsonObject | undefined
    });
    return {
      ok: true,
      userMessage: "Missed outbound callback saved. If the patient calls back, the agent should resume with this context.",
      data: { callbackId: callback.id }
    };
  }

  async escalate(input: { callSessionId?: string; patientId?: string; reason: "HUMAN_REQUEST" | "CLINICAL_CONCERN" | "OTHER"; summary: string }) {
    const followup = await this.callSessions.escalate(input);
    return {
      ok: true,
      userMessage: HUMAN_FOLLOWUP_MESSAGE,
      data: { followupId: followup.id }
    };
  }

  async createIdempotencyKey(prefix: string): Promise<string> {
    return `${prefix}:${randomUUID()}`;
  }
}
