import OpenAI from "openai";
import { env } from "../../config/env.js";

export function createOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for live LLM calls.");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
