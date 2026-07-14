# Evaluation Harness

## Purpose

Make the assignment independently re-runnable beyond happy-path single-turn checks.

## Implementation

`src/eval/runHarness.ts` runs scripted multi-turn scenarios against the live API. It reports success, turns, redundant questions, and network latency by language.

## Data Flow

scenario -> tool endpoint -> API response -> assertions -> JSON report

## Failure Cases

- API not running: scenario fails with connection error.
- Seed data missing: relevant tests fail visibly.
- ASR/TTS missing locally: report marks those as estimates.

## Alternatives

- Unit tests only: misses voice flow behavior.
- Manual calls only: hard to rerun and compare.

## Interview Questions

Q: Where does the harness give false confidence?

A: It cannot fully judge natural voice quality, ASR mistakes, or TTS barge-in without live call traces.

