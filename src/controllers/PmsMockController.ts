import type { Request, Response } from "express";
import { addDays } from "date-fns";
import { prisma } from "../database/prisma.js";
import { hashRequest } from "../utils/idempotency.js";

export class PmsMockController {
  createAppointment = async (req: Request, res: Response): Promise<void> => {
    const idempotencyKey = req.header("idempotency-key") ?? `missing:${req.body.appointmentId}`;
    const requestHash = hashRequest(req.body);
    const existing = await prisma.idempotencyRecord.findUnique({ where: { key: idempotencyKey } });

    if (existing?.response) {
      res.json(existing.response);
      return;
    }

    if (String(req.body.reason ?? "").includes("force-pms-failure")) {
      res.status(503).json({ ok: false, error: "Forced PMS failure for testing." });
      return;
    }

    const response = {
      ok: true,
      externalPmsId: `mock_pms_${req.body.appointmentId}`,
      persistedAt: new Date().toISOString()
    };

    await prisma.idempotencyRecord.upsert({
      where: { key: idempotencyKey },
      update: { response, requestHash },
      create: {
        key: idempotencyKey,
        scope: "mock-pms",
        requestHash,
        response,
        expiresAt: addDays(new Date(), 30)
      }
    });

    res.json(response);
  };
}
