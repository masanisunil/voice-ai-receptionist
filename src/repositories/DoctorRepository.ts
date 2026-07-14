import type { Branch, Doctor } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { DbClient } from "./types.js";

export type DoctorWithBranch = Doctor & { branch: Branch };

export class DoctorRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(id: string): Promise<DoctorWithBranch | null> {
    return this.db.doctor.findUnique({
      where: { id },
      include: { branch: true }
    });
  }

  search(filters: { doctorId?: string; branchId?: string; branchName?: string; specialty?: string }): Promise<DoctorWithBranch[]> {
    return this.db.doctor.findMany({
      where: {
        isActive: true,
        id: filters.doctorId,
        branchId: filters.branchId,
        specialty: filters.specialty ? { contains: filters.specialty, mode: "insensitive" } : undefined,
        branch: filters.branchName ? { name: { contains: filters.branchName, mode: "insensitive" } } : undefined
      },
      include: { branch: true },
      orderBy: [{ specialty: "asc" }, { fullName: "asc" }]
    });
  }
}
