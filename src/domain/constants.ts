export const ACTIVE_APPOINTMENT_STATUSES = ["HELD", "CONFIRMED"] as const;

export const TIME_OF_DAY_WINDOWS = {
  morning: { startMinute: 8 * 60, endMinute: 12 * 60 },
  afternoon: { startMinute: 12 * 60, endMinute: 17 * 60 },
  evening: { startMinute: 17 * 60, endMinute: 20 * 60 }
} as const;

export const DEFAULT_SLOT_LIMIT = 5;

export const HUMAN_FOLLOWUP_MESSAGE =
  "I can log this for the clinic team and someone will call you back. I do not want to pretend a live transfer is happening if it is not available.";
