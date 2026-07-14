import type { CallDirection } from "@prisma/client";
import { addHours, addMinutes } from "date-fns";
import { env } from "../config/env.js";
import { CallSessionRepository } from "../repositories/CallSessionRepository.js";
import { normalizePhoneE164 } from "../utils/phone.js";

export class CallSessionService {
  constructor(private readonly sessions = new CallSessionRepository()) {}

  async startOrResume(input: {
    phone: string;
    retellCallId?: string;
    direction?: CallDirection;
    language?: string;
    intent?: string;
  }) {
    const phoneE164 = normalizePhoneE164(input.phone);
    if (input.retellCallId) {
      const existingByCallId = await this.sessions.findByRetellCallId(input.retellCallId);
      if (existingByCallId) {
        return { session: existingByCallId, recoveryType: "same_call" as const, userMessage: "Continuing the current call." };
      }
    }

    const recoverableSince = addMinutes(new Date(), -env.DROPPED_CALL_RECOVERY_MINUTES);
    const recoverable = await this.sessions.findRecoverableByPhone(phoneE164, recoverableSince);
    if (recoverable) {
      const session = await this.sessions.update(recoverable.id, {
        retellCallId: input.retellCallId ?? recoverable.retellCallId,
        status: "IN_PROGRESS",
        language: input.language ?? recoverable.language
      });
      return {
        session,
        recoveryType: recoverable.status === "DROPPED" ? ("dropped_call" as const) : ("open_call" as const),
        userMessage:
          recoverable.status === "DROPPED"
            ? "Looks like the call dropped. I can pick up from where we left off."
            : "I have your current conversation open, so I will continue from there."
      };
    }

    const missedSince = addHours(new Date(), -env.MISSED_CALLBACK_RECOVERY_HOURS);
    const callback = await this.sessions.findMissedCallback(phoneE164, missedSince);
    const session = await this.sessions.create({
      phoneE164,
      retellCallId: input.retellCallId,
      direction: input.direction ?? "INBOUND",
      status: "IN_PROGRESS",
      language: input.language,
      intent: input.intent,
      callback: callback ? { connect: { id: callback.id } } : undefined,
      state: callback ? { recoveredCallbackContext: callback.context } : undefined
    });

    if (callback) {
      await this.sessions.updateCallback(callback.id, { status: "RESOLVED", resolvedAt: new Date() });
      return {
        session,
        recoveryType: "missed_callback" as const,
        userMessage: "Thanks for calling back. I have the earlier callback context and can continue from there."
      };
    }

    return { session, recoveryType: "new_call" as const, userMessage: "Starting a new call." };
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
    return this.sessions.createMessage({
      callSession: { connect: { id: input.callSessionId } },
      role: input.role,
      transcript: input.transcript,
      language: input.language,
      toolName: input.toolName,
      payload: input.payload === undefined ? undefined : (input.payload as object),
      latencyMs: input.latencyMs
    });
  }

  async markDropped(callSessionId: string) {
    await this.sessions.createFollowup({
      callSession: { connect: { id: callSessionId } },
      reason: "DROPPED_CALL",
      summary: "Call dropped before completion; recover automatically if the caller returns within the recovery window."
    });
    return this.sessions.update(callSessionId, { status: "DROPPED", droppedAt: new Date() });
  }

  async complete(callSessionId: string) {
    return this.sessions.update(callSessionId, { status: "COMPLETED", completedAt: new Date() });
  }

  async escalate(input: { callSessionId?: string; patientId?: string; reason: "HUMAN_REQUEST" | "CLINICAL_CONCERN" | "OTHER"; summary: string }) {
    if (input.callSessionId) {
      await this.sessions.update(input.callSessionId, { status: "ESCALATED" });
    }
    return this.sessions.createFollowup({
      callSession: input.callSessionId ? { connect: { id: input.callSessionId } } : undefined,
      patient: input.patientId ? { connect: { id: input.patientId } } : undefined,
      reason: input.reason,
      summary: input.summary
    });
  }
}
