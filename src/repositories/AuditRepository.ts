import type { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { DbClient } from "./types.js";

export class AuditRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(data: Prisma.AuditLogCreateInput) {
    return this.db.auditLog.create({ data });
  }
}
