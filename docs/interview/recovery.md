# Dropped Calls And Missed Callbacks

## Purpose

Avoid restarting calls when the patient calls back after a disconnect or missed outbound call.

## Implementation

`CallSessionService.startOrResume` first checks for a Retell call ID, then recoverable `IN_PROGRESS` or `DROPPED` sessions by phone, then missed callbacks by phone. It returns a recovery type and speakable acknowledgement.

## Data Flow

phone number -> session lookup -> callback lookup -> session state -> Retell acknowledgement

## Failure Cases

- No recoverable session: start fresh.
- Shared phone: identify still asks for full name before booking.
- Clinical concern during recovery: create pending follow-up.

## Alternatives

- Store recovery only in Retell memory: fails when a new call starts.
- Recover forever by phone number: dangerous for privacy and stale state.

## Interview Questions

Q: Why use a recovery window?

A: It balances continuity with avoiding stale or wrong context after enough time has passed.

Q: What if two people share a phone?

A: Recovery gives context, but booking still requires full-name disambiguation.

