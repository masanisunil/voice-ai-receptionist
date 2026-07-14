import { describe, expect, it } from "vitest";
import { availabilityRequestSchema, bookingRequestSchema } from "../../src/tools/schemas.js";

describe("tool schemas", () => {
  it("coerces availability dates", () => {
    const parsed = availabilityRequestSchema.parse({
      from: "2026-07-14T00:00:00.000Z",
      to: "2026-07-21T00:00:00.000Z",
      specialty: "Urology"
    });
    expect(parsed.from).toBeInstanceOf(Date);
  });

  it("requires idempotency for booking writes", () => {
    expect(() =>
      bookingRequestSchema.parse({
        patientFullName: "Test Patient",
        phoneE164: "+919999000099",
        doctorId: "doc",
        branchId: "branch",
        startAt: "2026-07-14T10:00:00.000Z"
      })
    ).toThrow();
  });
});
