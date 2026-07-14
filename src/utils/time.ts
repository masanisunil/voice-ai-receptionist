import { addMinutes, differenceInHours, eachDayOfInterval, format, isBefore, isEqual } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { TIME_OF_DAY_WINDOWS } from "../domain/constants.js";

export function localDateTimeToUtc(date: Date, hour: number, minute: number, timezone: string): Date {
  const local = toZonedTime(date, timezone);
  local.setHours(hour, minute, 0, 0);
  return fromZonedTime(local, timezone);
}

export function setMinutesOnLocalDate(date: Date, minuteOfDay: number, timezone: string): Date {
  return localDateTimeToUtc(date, Math.floor(minuteOfDay / 60), minuteOfDay % 60, timezone);
}

export function formatSlotForVoice(startAt: Date, endAt: Date, timezone: string): string {
  const date = formatInTimeZone(startAt, timezone, "EEEE, MMM d");
  const start = formatInTimeZone(startAt, timezone, "h:mm a");
  const end = formatInTimeZone(endAt, timezone, "h:mm a");
  return `${date} from ${start} to ${end}`;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date, bufferMinutes = 0): boolean {
  const bufferedStart = addMinutes(bStart, -bufferMinutes);
  const bufferedEnd = addMinutes(bEnd, bufferMinutes);
  return aStart < bufferedEnd && aEnd > bufferedStart;
}

export function isWithinFeeWindow(startAt: Date, now: Date, feeWindowHours: number): boolean {
  return differenceInHours(startAt, now) < feeWindowHours;
}

export function dateRangeDays(from: Date, to: Date): Date[] {
  return eachDayOfInterval({ start: from, end: to });
}

export function dateAtStartOfDay(date: Date, timezone: string): Date {
  const local = toZonedTime(date, timezone);
  local.setHours(0, 0, 0, 0);
  return fromZonedTime(local, timezone);
}

export function dateAtEndOfDay(date: Date, timezone: string): Date {
  const local = toZonedTime(date, timezone);
  local.setHours(23, 59, 59, 999);
  return fromZonedTime(local, timezone);
}

export function dateFallsInTimeOfDay(date: Date, timeOfDay: keyof typeof TIME_OF_DAY_WINDOWS | undefined, timezone: string): boolean {
  if (!timeOfDay) return true;
  const local = toZonedTime(date, timezone);
  const minute = local.getHours() * 60 + local.getMinutes();
  const window = TIME_OF_DAY_WINDOWS[timeOfDay];
  return minute >= window.startMinute && minute < window.endMinute;
}

export function isOnOrAfter(date: Date, floor: Date): boolean {
  return isEqual(date, floor) || !isBefore(date, floor);
}

export function dayOfWeekInTimezone(date: Date, timezone: string): number {
  return Number(format(toZonedTime(date, timezone), "i")) % 7;
}
