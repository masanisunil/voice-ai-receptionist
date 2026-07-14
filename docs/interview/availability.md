# Availability And Conflict Search

## Purpose

Resolve natural time requests like "around 1", "Thursday morning", "after work", and "earliest today" against live data.

## Implementation

`AvailabilityService.search` queries active availability windows and active appointments, generates candidate slots, filters by day, branch, doctor, specialty, time-of-day, around-time, same-day buffer, and appointment buffer.

## Architecture

The service is pure business logic above repository reads. It can be reused by REST, Retell tools, and eval harness.

## Data Flow

request constraints -> availability windows -> active appointments -> generated slots -> sorted earliest options

## Failure Cases

- No slots: ask for another branch/time.
- Stale memory: every new request calls the tool again.
- Same-day timezone bug: all communication uses clinic timezone formatting.

## Alternatives

- Precompute every slot: faster reads, but harder to keep fresh.
- Query PMS for every turn: most accurate, but slow and credential-dependent.

## Interview Questions

Q: How do you search across branches?

A: Omit the branch filter and sort generated slots across all matching windows.

Q: How is buffer time respected?

A: Slot generation advances by duration plus buffer, and conflict checks include buffer around active appointments.

