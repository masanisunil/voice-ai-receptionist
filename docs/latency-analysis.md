# Latency Analysis

## Components

- ASR latency: Retell speech-to-text time.
- LLM latency: GPT-4.1 tool decision and response generation.
- Tool latency: backend API time.
- Database latency: Prisma/Postgres query and transaction time.
- PMS latency: mock or Cliniko write-back.
- TTS latency: Retell voice synthesis time.
- Network latency: caller to Retell plus Retell to backend.

## Backend Targets

| Operation | Target |
| --- | ---: |
| Identify patient | < 150 ms p95 |
| Search availability | < 400 ms p95 for two branches |
| Book appointment | < 700 ms p95 excluding PMS |
| PMS mock write-back | < 300 ms p95 |

## Latency Masking

The prompt allows one short holding phrase while tools run. It forbids repeated filler, stuttering, or cutting off mid-word.

## Why These Metrics

Voice UX fails when the caller hears dead air or when the agent asks redundant questions. Backend p95 is measured because a few slow tool calls are more damaging than a slightly slower average.

