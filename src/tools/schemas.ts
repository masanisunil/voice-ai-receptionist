import { z } from "zod";

export const languageSchema = z.enum(["en", "hi", "mixed"]).optional();

export const availabilityRequestSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  branchId: z.string().optional(),
  branchName: z.string().optional(),
  doctorId: z.string().optional(),
  specialty: z.string().optional(),
  preferredDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  earliestOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(20).optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).optional(),
  aroundHour: z.number().int().min(0).max(23).optional(),
  aroundMinute: z.number().int().min(0).max(59).optional()
});

export const identifyPatientSchema = z.object({
  phoneE164: z.string().min(8),
  fullName: z.string().min(1).optional()
});

export const bookingRequestSchema = z.object({
  patientFullName: z.string().min(1),
  phoneE164: z.string().min(8),
  doctorId: z.string().min(1),
  branchId: z.string().min(1),
  startAt: z.coerce.date(),
  reason: z.string().optional(),
  language: languageSchema,
  callSessionId: z.string().optional(),
  idempotencyKey: z.string().min(8)
});

export const rescheduleRequestSchema = z.object({
  appointmentId: z.string().min(1),
  newDoctorId: z.string().min(1),
  newBranchId: z.string().min(1),
  newStartAt: z.coerce.date(),
  idempotencyKey: z.string().min(8),
  language: languageSchema,
  callSessionId: z.string().optional()
});

export const cancellationRequestSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().optional(),
  language: languageSchema,
  callSessionId: z.string().optional()
});

export const startCallSchema = z.object({
  phoneE164: z.string().min(8),
  retellCallId: z.string().optional(),
  direction: z.enum(["INBOUND", "OUTBOUND"]).optional(),
  language: z.string().optional(),
  intent: z.string().optional()
});

export const recordTurnSchema = z.object({
  callSessionId: z.string().min(1),
  role: z.string().min(1),
  transcript: z.string().optional(),
  language: z.string().optional(),
  toolName: z.string().optional(),
  payload: z.unknown().optional(),
  latencyMs: z.number().int().nonnegative().optional()
});

export const callEventSchema = z.object({
  callSessionId: z.string().optional(),
  phoneE164: z.string().optional(),
  event: z.enum(["call_started", "call_dropped", "call_ended", "outbound_no_answer"]),
  retellCallId: z.string().optional(),
  language: z.string().optional(),
  context: z.record(z.unknown()).optional()
});

export const escalationSchema = z.object({
  callSessionId: z.string().optional(),
  patientId: z.string().optional(),
  reason: z.enum(["HUMAN_REQUEST", "CLINICAL_CONCERN", "OTHER"]),
  summary: z.string().min(1)
});

export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type RescheduleRequest = z.infer<typeof rescheduleRequestSchema>;
export type CancellationRequest = z.infer<typeof cancellationRequestSchema>;
