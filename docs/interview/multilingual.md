# Multilingual Behavior

## Purpose

Handle English, Hindi, and mid-call code-switching without a hardcoded translation table.

## Implementation

The prompt instructs GPT-4.1 to match language mode and avoid drifting. Tool responses return structured data plus concise English user messages; Retell/GPT can render the final response naturally in the caller's language while keeping IDs and facts stable.

## Data Flow

caller speech -> Retell ASR -> GPT-4.1 state/tool decision -> backend tool -> GPT response -> Retell TTS

## Failure Cases

- Pure English turn drifts into Hindi: prompt forbids drift.
- Pure Hindi turn gets random English: prompt forbids random insertion.
- Code-switch sounds stitched: prompt asks to match naturally.

## Alternatives

- Translation dictionary: rejected by assignment and fails unseen phrases.
- Separate Hindi and English agents: harder for code-switching.

## Interview Questions

Q: How do you verify language handling?

A: Eval reports by language and should be extended with transcript-level checks and real call traces.

