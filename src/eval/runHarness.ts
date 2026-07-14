import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { scenarios, type EvalClient, type EvalScenarioResult } from "./scenarios.js";

const baseUrl = process.env.EVAL_BASE_URL ?? "http://localhost:8080";

const client: EvalClient = {
  async post<T>(requestPath: string, body: unknown): Promise<{ data: T; networkMs: number; status: number }> {
    const start = performance.now();
    const response = await fetch(`${baseUrl}${requestPath}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const networkMs = Math.round(performance.now() - start);
    const data = (await response.json()) as T;
    return { data, networkMs, status: response.status };
  }
};

function aggregate(results: Array<EvalScenarioResult & { id: string; language: string }>) {
  const byLanguage = new Map<string, typeof results>();
  for (const result of results) {
    const existing = byLanguage.get(result.language) ?? [];
    existing.push(result);
    byLanguage.set(result.language, existing);
  }

  return [...byLanguage.entries()].map(([language, languageResults]) => {
    const successCount = languageResults.filter((result) => result.success).length;
    return {
      language,
      scenarios: languageResults.length,
      successRate: successCount / languageResults.length,
      avgTurnsToCompletion:
        languageResults.reduce((sum, result) => sum + result.turns, 0) / Math.max(languageResults.length, 1),
      redundantQuestionRate:
        languageResults.reduce((sum, result) => sum + result.redundantQuestions, 0) / Math.max(languageResults.length, 1),
      avgNetworkMs:
        languageResults.reduce((sum, result) => sum + result.networkMs, 0) / Math.max(languageResults.length, 1),
      estimatedAsrMs: language === "hi" ? 380 : 300,
      estimatedLlmMs: 850,
      estimatedTtsMs: language === "hi" ? 520 : 430
    };
  });
}

async function main(): Promise<void> {
  const startedAt = new Date();
  const results: Array<EvalScenarioResult & { id: string; title: string; language: string; expectedMaxTurns: number }> = [];

  for (const scenario of scenarios) {
    try {
      const result = await scenario.run(client, { now: startedAt });
      results.push({
        ...result,
        id: scenario.id,
        title: scenario.title,
        language: scenario.language,
        expectedMaxTurns: scenario.expectedMaxTurns
      });
      console.log(`${result.success ? "PASS" : "FAIL"} ${scenario.id} turns=${result.turns} networkMs=${result.networkMs}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        id: scenario.id,
        title: scenario.title,
        language: scenario.language,
        expectedMaxTurns: scenario.expectedMaxTurns,
        success: false,
        turns: 0,
        redundantQuestions: 0,
        networkMs: 0,
        notes: [message]
      });
      console.log(`FAIL ${scenario.id} ${message}`);
    }
  }

  const report = {
    startedAt: startedAt.toISOString(),
    baseUrl,
    summary: aggregate(results),
    results,
    notes: [
      "Network latency is measured against the backend API.",
      "ASR/TTS latency fields are estimates in local mode; replace with Retell call trace timings for live evaluation.",
      "Redundant question counts are scenario assertions; production should also inspect conversation transcripts."
    ]
  };

  const outputDir = path.join(process.cwd(), "eval-results");
  await fs.mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, `eval-${startedAt.toISOString().replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(outputFile, JSON.stringify(report, null, 2));
  console.log(`Wrote ${outputFile}`);
}

void main();
