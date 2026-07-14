import type { Appointment, Branch, Doctor, Patient } from "@prisma/client";

export type LanguageCode = "en" | "hi" | "mixed";

export type TimeWindow = {
  from: Date;
  to: Date;
};

export type Slot = {
  doctorId: string;
  doctorName: string;
  branchId: string;
  branchName: string;
  specialty: string;
  startAt: Date;
  endAt: Date;
  slotDurationMinutes: number;
  bufferMinutes: number;
};

export type AvailabilitySearchInput = {
  from: Date;
  to: Date;
  branchId?: string;
  branchName?: string;
  doctorId?: string;
  specialty?: string;
  preferredDaysOfWeek?: number[];
  earliestOnly?: boolean;
  limit?: number;
  timeOfDay?: "morning" | "afternoon" | "evening";
  aroundHour?: number;
  aroundMinute?: number;
  requestId?: string;
};

export type BookingInput = {
  patientFullName: string;
  phoneE164: string;
  doctorId: string;
  branchId: string;
  startAt: Date;
  reason?: string;
  language?: LanguageCode;
  callSessionId?: string;
  idempotencyKey: string;
};

export type RescheduleInput = {
  appointmentId: string;
  newDoctorId: string;
  newBranchId: string;
  newStartAt: Date;
  idempotencyKey: string;
  language?: LanguageCode;
  callSessionId?: string;
};

export type CancellationInput = {
  appointmentId: string;
  reason?: string;
  language?: LanguageCode;
  callSessionId?: string;
};

export type IdentifiedPatient =
  | {
      status: "identified";
      patient: Patient;
      returningPatient: boolean;
      needsNameCapture: false;
      sharedPhoneCandidates?: never;
    }
  | {
      status: "returning_needs_name";
      patient: Pick<Patient, "id" | "fullName" | "languagePreference">;
      returningPatient: true;
      needsNameCapture: true;
      sharedPhoneCandidates?: never;
    }
  | {
      status: "ambiguous";
      needsNameCapture: true;
      sharedPhoneCandidates: Pick<Patient, "id" | "fullName" | "languagePreference">[];
    }
  | {
      status: "new";
      needsNameCapture: true;
    };

export type AppointmentWithDetails = Appointment & {
  patient: Patient;
  doctor: Doctor;
  branch: Branch;
};

export type ToolResponse<T> = {
  ok: boolean;
  userMessage: string;
  data?: T;
  errorCode?: string;
};
