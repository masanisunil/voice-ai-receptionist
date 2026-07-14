import { describe, expect, it } from "vitest";
import { namesMatch, naturalDoctorName, normalizeName } from "../../src/utils/text.js";

describe("text utilities", () => {
  it("normalizes patient names for shared phone disambiguation", () => {
    expect(normalizeName("  Ananya   Rao ")).toBe("ananya rao");
    expect(namesMatch("Ananya Rao", "ananya   rao")).toBe(true);
  });

  it("turns all-caps names into a speakable form", () => {
    expect(naturalDoctorName("DR. PRASANNA VENKATESH")).toContain("Doctor");
  });
});
