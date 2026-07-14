import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";

export class HealthController {
  health = (_req: Request, res: Response): void => {
    res.json({ ok: true, status: "healthy" });
  };

  ready = async (_req: Request, res: Response): Promise<void> => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, status: "ready" });
  };
}
