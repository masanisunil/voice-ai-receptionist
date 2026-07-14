import type { Patient, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { DbClient } from "./types.js";

export class PatientRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findByPhone(phoneE164: string): Promise<Patient[]> {
    return this.db.patient.findMany({
      where: { phoneE164 },
      orderBy: { updatedAt: "desc" }
    });
  }

  findByPhoneAndName(phoneE164: string, normalizedName: string): Promise<Patient | null> {
    return this.db.patient.findFirst({
      where: { phoneE164, normalizedName }
    });
  }

  findById(id: string): Promise<Patient | null> {
    return this.db.patient.findUnique({ where: { id } });
  }

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.db.patient.create({ data });
  }

  updateLanguage(patientId: string, languagePreference: string): Promise<Patient> {
    return this.db.patient.update({
      where: { id: patientId },
      data: { languagePreference }
    });
  }
}
