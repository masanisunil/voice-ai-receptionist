import type { CallDirection, CallSession, CallSessionStatus, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { DbClient } from "./types.js";

export class CallSessionRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findByRetellCallId(retellCallId: string): Promise<CallSession | null> {
    return this.db.callSession.findUnique({ where: { retellCallId } });
  }

  findRecoverableByPhone(phoneE164: string, since: Date): Promise<CallSession | null> {
    return this.db.callSession.findFirst({
      where: {
        phoneE164,
        status: { in: ["IN_PROGRESS", "DROPPED"] },
        updatedAt: { gte: since }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  create(data: Prisma.CallSessionCreateInput): Promise<CallSession> {
    return this.db.callSession.create({ data });
  }

  update(id: string, data: Prisma.CallSessionUpdateInput): Promise<CallSession> {
    return this.db.callSession.update({ where: { id }, data });
  }

  createMessage(data: Prisma.ConversationMessageCreateInput) {
    return this.db.conversationMessage.create({ data });
  }

  findMissedCallback(phoneE164: string, since: Date) {
    return this.db.outboundCallback.findFirst({
      where: {
        phoneE164,
        status: "MISSED",
        updatedAt: { gte: since }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  updateCallback(id: string, data: Prisma.OutboundCallbackUpdateInput) {
    return this.db.outboundCallback.update({ where: { id }, data });
  }

  createCallback(data: Prisma.OutboundCallbackCreateInput) {
    return this.db.outboundCallback.create({ data });
  }

  createFollowup(data: Prisma.PendingFollowupCreateInput) {
    return this.db.pendingFollowup.create({ data });
  }
}
