import { addMinutes } from "date-fns";
import { env } from "../config/env.js";
import { DEFAULT_SLOT_LIMIT } from "../domain/constants.js";
import type { AvailabilitySearchInput, Slot } from "../domain/types.js";
import { AvailabilityRepository } from "../repositories/AvailabilityRepository.js";
import {
  dateFallsInTimeOfDay,
  dateRangeDays,
  dayOfWeekInTimezone,
  isOnOrAfter,
  overlaps,
  setMinutesOnLocalDate
} from "../utils/time.js";

export class AvailabilityService {
  constructor(private readonly availability = new AvailabilityRepository()) {}

  async search(input: AvailabilitySearchInput): Promise<Slot[]> {
    const limit = input.earliestOnly ? 1 : input.limit ?? DEFAULT_SLOT_LIMIT;
    const windows = await this.availability.findWindows({
      branchId: input.branchId,
      branchName: input.branchName,
      specialty: input.specialty,
      doctorIds: input.doctorId ? [input.doctorId] : undefined
    });
    const doctorIds = [...new Set(windows.map((window) => window.doctorId))];
    const appointments = await this.availability.findActiveAppointments(doctorIds, input.from, input.to);
    const nowFloor = addMinutes(new Date(), env.SAME_DAY_BUFFER_MINUTES);
    const slots: Slot[] = [];

    for (const day of dateRangeDays(input.from, input.to)) {
      for (const window of windows) {
        const timezone = window.branch.timezone;
        if (window.dayOfWeek !== dayOfWeekInTimezone(day, timezone)) continue;
        if (input.preferredDaysOfWeek && !input.preferredDaysOfWeek.includes(window.dayOfWeek)) continue;

        let cursor = setMinutesOnLocalDate(day, window.startMinute, timezone);
        const dayWindowEnd = setMinutesOnLocalDate(day, window.endMinute, timezone);

        while (addMinutes(cursor, window.slotDurationMinutes) <= dayWindowEnd) {
          const endAt = addMinutes(cursor, window.slotDurationMinutes);
          const matchesRange = cursor >= input.from && endAt <= input.to;
          const matchesFloor = isOnOrAfter(cursor, nowFloor);
          const matchesTimeOfDay = dateFallsInTimeOfDay(cursor, input.timeOfDay, timezone);
          const matchesAround =
            input.aroundHour === undefined ||
            Math.abs(
              cursor.getTime() -
                setMinutesOnLocalDate(day, input.aroundHour * 60 + (input.aroundMinute ?? 0), timezone).getTime()
            ) <=
              90 * 60_000;

          const hasConflict = appointments.some(
            (appointment) =>
              appointment.doctorId === window.doctorId &&
              overlaps(cursor, endAt, appointment.startAt, appointment.endAt, window.bufferMinutes)
          );

          if (matchesRange && matchesFloor && matchesTimeOfDay && matchesAround && !hasConflict) {
            slots.push({
              doctorId: window.doctorId,
              doctorName: window.doctor.spokenName,
              branchId: window.branchId,
              branchName: window.branch.name,
              specialty: window.doctor.specialty,
              startAt: cursor,
              endAt,
              slotDurationMinutes: window.slotDurationMinutes,
              bufferMinutes: window.bufferMinutes
            });
          }

          cursor = addMinutes(cursor, window.slotDurationMinutes + window.bufferMinutes);
        }
      }
    }

    return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime()).slice(0, limit);
  }
}
