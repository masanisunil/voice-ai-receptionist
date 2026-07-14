import { addDays } from "date-fns";

export type EvalLanguage = "en" | "hi" | "mixed";

export type EvalScenario = {
  id: string;
  title: string;
  language: EvalLanguage;
  objective: string;
  expectedMaxTurns: number;
  run: (client: EvalClient, context: EvalContext) => Promise<EvalScenarioResult>;
};

export type EvalClient = {
  post: <T>(path: string, body: unknown) => Promise<{ data: T; networkMs: number; status: number }>;
};

export type EvalContext = {
  now: Date;
};

export type EvalScenarioResult = {
  success: boolean;
  turns: number;
  redundantQuestions: number;
  notes: string[];
  networkMs: number;
};

function nextWindow(dayOffset: number, hour: number, minute = 0): Date {
  const date = addDays(new Date(), dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function availability(client: EvalClient, body: Record<string, unknown>) {
  return client.post<{ data?: { slots?: Array<{ doctorId: string; branchId: string; startAt: string }> }; ok?: boolean }>(
    "/api/voice/tools/availability",
    body
  );
}

export const scenarios: EvalScenario[] = [
  {
    id: "en-earliest-cross-branch",
    title: "English earliest slot across branches",
    language: "en",
    objective: "Find the earliest urology slot without anchoring on one branch.",
    expectedMaxTurns: 4,
    run: async (client) => {
      const from = new Date();
      const to = addDays(from, 10);
      const result = await availability(client, {
        from,
        to,
        specialty: "Urology",
        earliestOnly: true
      });
      const slots = result.data.data?.slots ?? [];
      const firstSlot = slots[0];
      return {
        success: result.status === 200 && slots.length === 1,
        turns: 2,
        redundantQuestions: 0,
        notes: firstSlot ? [`Earliest slot ${firstSlot.startAt}`] : ["No slot returned."],
        networkMs: result.networkMs
      };
    }
  },
  {
    id: "hi-family-line-disambiguation",
    title: "Hindi shared phone disambiguation",
    language: "hi",
    objective: "Shared family phone number should ask for name before choosing a patient.",
    expectedMaxTurns: 3,
    run: async (client) => {
      const result = await client.post<{ data?: { status?: string; sharedPhoneCandidates?: unknown[] } }>("/api/voice/tools/identify", {
        phoneE164: "+919999000002"
      });
      const status = result.data.data?.status;
      return {
        success: result.status === 200 && status === "ambiguous",
        turns: 1,
        redundantQuestions: 0,
        notes: [`Identify status: ${status}`],
        networkMs: result.networkMs
      };
    }
  },
  {
    id: "mixed-dropped-call-recovery",
    title: "Mixed language dropped call recovery",
    language: "mixed",
    objective: "Caller returns after a drop and resumes with saved context.",
    expectedMaxTurns: 2,
    run: async (client) => {
      const result = await client.post<{ data?: { recoveryType?: string } }>("/api/voice/tools/start-call", {
        phoneE164: "+919999000001",
        retellCallId: `eval_drop_${Date.now()}`,
        language: "mixed",
        intent: "booking"
      });
      const recoveryType = result.data.data?.recoveryType;
      return {
        success: result.status === 200 && recoveryType === "dropped_call",
        turns: 1,
        redundantQuestions: 0,
        notes: [`Recovery type: ${recoveryType}`],
        networkMs: result.networkMs
      };
    }
  },
  {
    id: "en-stale-availability-recheck",
    title: "English stale availability re-check",
    language: "en",
    objective: "A second availability question must make a fresh call with different constraints.",
    expectedMaxTurns: 5,
    run: async (client) => {
      const first = await availability(client, {
        from: new Date(),
        to: addDays(new Date(), 10),
        specialty: "Urology",
        timeOfDay: "morning",
        limit: 2
      });
      const second = await availability(client, {
        from: new Date(),
        to: addDays(new Date(), 10),
        specialty: "Urology",
        timeOfDay: "afternoon",
        limit: 2
      });
      const firstSlots = first.data.data?.slots ?? [];
      const secondSlots = second.data.data?.slots ?? [];
      return {
        success: first.status === 200 && second.status === 200 && JSON.stringify(firstSlots) !== JSON.stringify(secondSlots),
        turns: 3,
        redundantQuestions: 0,
        notes: [`First slots: ${firstSlots.length}`, `Second slots: ${secondSlots.length}`],
        networkMs: first.networkMs + second.networkMs
      };
    }
  },
  {
    id: "hi-branch-specialty",
    title: "Hindi branch specific specialty lookup",
    language: "hi",
    objective: "Named branch specialty availability should work consistently.",
    expectedMaxTurns: 4,
    run: async (client) => {
      const result = await availability(client, {
        from: new Date(),
        to: addDays(new Date(), 14),
        branchId: "branch_padmanabhanagar",
        specialty: "Nephrology",
        limit: 2
      });
      const slots = result.data.data?.slots ?? [];
      return {
        success: result.status === 200 && slots.every((slot) => slot.branchId === "branch_padmanabhanagar"),
        turns: 2,
        redundantQuestions: 0,
        notes: [`Branch slots: ${slots.length}`],
        networkMs: result.networkMs
      };
    }
  },
  {
    id: "en-missed-callback",
    title: "English missed outbound callback recovery",
    language: "en",
    objective: "Patient calling back after missed outbound call resumes with callback context.",
    expectedMaxTurns: 2,
    run: async (client) => {
      const phone = `+91999988${String(Date.now()).slice(-6)}`;
      await client.post("/api/voice/tools/call-event", {
        event: "outbound_no_answer",
        phoneE164: phone,
        context: { specialty: "Urology", preferredBranchId: "branch_rajajinagar" }
      });
      const start = await client.post<{ data?: { recoveryType?: string } }>("/api/voice/tools/start-call", {
        phoneE164: phone,
        retellCallId: `eval_callback_${Date.now()}`,
        language: "en"
      });
      return {
        success: start.status === 200 && start.data.data?.recoveryType === "missed_callback",
        turns: 1,
        redundantQuestions: 0,
        notes: [`Recovery type: ${start.data.data?.recoveryType}`],
        networkMs: start.networkMs
      };
    }
  },
  {
    id: "mixed-booking-idempotency",
    title: "Mixed language idempotent booking",
    language: "mixed",
    objective: "Repeated booking write with same idempotency key returns the same appointment.",
    expectedMaxTurns: 6,
    run: async (client) => {
      const slotsResponse = await availability(client, {
        from: new Date(),
        to: addDays(new Date(), 10),
        specialty: "Urology",
        limit: 1
      });
      const slot = slotsResponse.data.data?.slots?.[0];
      if (!slot) {
        return {
          success: false,
          turns: 2,
          redundantQuestions: 0,
          notes: ["No slot available for booking test."],
          networkMs: slotsResponse.networkMs
        };
      }

      const body = {
        patientFullName: "Eval Patient",
        phoneE164: `+919998${String(Date.now()).slice(-6)}`,
        doctorId: slot.doctorId,
        branchId: slot.branchId,
        startAt: slot.startAt,
        reason: "Evaluation booking",
        language: "mixed",
        idempotencyKey: `eval-booking-${Date.now()}`
      };
      const first = await client.post<{ data?: { appointment?: { id: string } } }>("/api/voice/tools/book", body);
      const second = await client.post<{ data?: { appointment?: { id: string } } }>("/api/voice/tools/book", body);
      return {
        success:
          first.status === 200 &&
          second.status === 200 &&
          first.data.data?.appointment?.id === second.data.data?.appointment?.id,
        turns: 4,
        redundantQuestions: 0,
        notes: [`Appointment: ${first.data.data?.appointment?.id ?? "none"}`],
        networkMs: slotsResponse.networkMs + first.networkMs + second.networkMs
      };
    }
  },
  {
    id: "en-afternoon-natural-time",
    title: "English underspecified afternoon time",
    language: "en",
    objective: "Resolve 'after work around 4:30' against live availability.",
    expectedMaxTurns: 4,
    run: async (client) => {
      const result = await availability(client, {
        from: nextWindow(1, 0),
        to: addDays(new Date(), 14),
        specialty: "Nephrology",
        timeOfDay: "afternoon",
        aroundHour: 16,
        aroundMinute: 30,
        limit: 3
      });
      return {
        success: result.status === 200,
        turns: 2,
        redundantQuestions: 0,
        notes: [`Status ${result.status}`],
        networkMs: result.networkMs
      };
    }
  }
];
