import type { Request, Response } from "express";
import { VoiceToolService } from "../services/VoiceToolService.js";

export class VoiceController {
  constructor(private readonly voiceTools = new VoiceToolService()) {}

  identify = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.identify(req.body));
  };

  availability = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.searchAvailability(req.body));
  };

  book = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.book(req.body));
  };

  reschedule = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.reschedule(req.body));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.cancel(req.body));
  };

  startCall = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.startCall(req.body));
  };

  recordTurn = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.recordTurn(req.body));
  };

  callEvent = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.handleCallEvent(req.body));
  };

  escalate = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.voiceTools.escalate(req.body));
  };
}
