import { describe, expect, it } from "vitest";
import { addMinutes } from "date-fns";
import { isWithinFeeWindow, overlaps } from "../../src/utils/time.js";

describe("time utilities", () => {
  it("detects overlaps with buffer", () => {
    const start = new Date("2026-07-14T10:00:00.000Z");
    const end = addMinutes(start, 30);
    const nextStart = addMinutes(end, 5);
    const nextEnd = addMinutes(nextStart, 30);

    expect(overlaps(nextStart, nextEnd, start, end, 10)).toBe(true);
    expect(overlaps(addMinutes(end, 15), addMinutes(end, 45), start, end, 10)).toBe(false);
  });

  it("applies fee window only inside the configured hours", () => {
    const now = new Date("2026-07-14T10:00:00.000Z");
    expect(isWithinFeeWindow(new Date("2026-07-15T09:00:00.000Z"), now, 24)).toBe(true);
    expect(isWithinFeeWindow(new Date("2026-07-16T11:00:00.000Z"), now, 24)).toBe(false);
  });
});
