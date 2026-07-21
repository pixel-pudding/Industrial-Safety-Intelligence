# Incident 08 — Shift Changeover Communication Gap

**Zone:** D (cross-shift) · **Date:** 2023-02-14 · **Severity:** Near-miss
**Hazard category:** Process drift / communication failure
**Contributing factors:** incomplete handover note, verbal-only communication, no persistent flag on outgoing sub-threshold condition

## Narrative

An outgoing Shift A supervisor verbally mentioned a mildly elevated
BLEND-TEMP reading in Zone D to the incoming Shift B supervisor during a
busy changeover, but it was never written into the formal handover log.
Shift B, unaware of the trend's starting point, did not recognize the
reading three hours later as a continuation of the same drift rather than a
new, still-normal fluctuation. The temperature crossed into Warning range
before being independently caught by a Zone D operator's routine round.

## Root Cause

Verbal-only handover of a sub-threshold condition with no persistent record
meant the receiving shift had no way to distinguish "new reading" from
"continuation of a known trend" — the temporal context of the drift was
lost at the shift boundary.

## Lessons Learned

Any zone with a non-normal (even sub-Warning) trend at shift changeover
should generate a persistent flagged-condition record that carries forward
automatically across the boundary, rather than depending on the
completeness of a verbal handover.
