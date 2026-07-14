import type { Patient } from "@prisma/client";
import { PatientRepository } from "../repositories/PatientRepository.js";
import type { IdentifiedPatient } from "../domain/types.js";
import { normalizeName } from "../utils/text.js";
import { normalizePhoneE164 } from "../utils/phone.js";

export class PatientService {
  constructor(private readonly patients = new PatientRepository()) {}

  async identify(phone: string, fullName?: string): Promise<IdentifiedPatient> {
    const phoneE164 = normalizePhoneE164(phone);
    const matches = await this.patients.findByPhone(phoneE164);
    if (matches.length === 0) {
      return { status: "new", needsNameCapture: true };
    }

    if (fullName) {
      const patient = await this.patients.findByPhoneAndName(phoneE164, normalizeName(fullName));
      if (patient) {
        return { status: "identified", patient, returningPatient: true, needsNameCapture: false };
      }
    }

    const singleMatch = matches[0];
    if (matches.length === 1 && singleMatch) {
      if (fullName) {
        return { status: "identified", patient: singleMatch, returningPatient: true, needsNameCapture: false };
      }
      return {
        status: "returning_needs_name",
        patient: {
          id: singleMatch.id,
          fullName: singleMatch.fullName,
          languagePreference: singleMatch.languagePreference
        },
        returningPatient: true,
        needsNameCapture: true
      };
    }

    return {
      status: "ambiguous",
      needsNameCapture: true,
      sharedPhoneCandidates: matches.map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        languagePreference: patient.languagePreference
      }))
    };
  }

  async findOrCreateForBooking(phone: string, fullName: string, languagePreference?: string): Promise<Patient> {
    const phoneE164 = normalizePhoneE164(phone);
    const normalizedName = normalizeName(fullName);
    const existing = await this.patients.findByPhoneAndName(phoneE164, normalizedName);
    if (existing) return existing;

    return this.patients.create({
      fullName: fullName.trim(),
      normalizedName,
      phoneE164,
      languagePreference
    });
  }
}
