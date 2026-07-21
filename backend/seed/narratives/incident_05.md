# Incident 05 — Static Discharge Incident

**Zone:** G (Loading Bay) · **Date:** 2019-06-27 · **Severity:** Near-miss
**Hazard category:** Static discharge / ignition source
**Contributing factors:** grounding clamp corrosion, grounding check bypassed, rushed loading schedule

## Narrative

A tanker loading toluene at the Loading Bay began transfer with a failed
grounding connection (GND-CONT: Fail) that was not caught before LOAD-FLOW
began. A visible static spark occurred at the coupling point during a
rushed changeover between two scheduled tankers. No vapor ignition
occurred, but the spark was witnessed directly by the loading arm operator,
who immediately halted flow.

## Root Cause

Grounding continuity check was a manual pre-transfer step that could be —
and was — skipped under schedule pressure. The corroded clamp itself had
already been flagged in a prior maintenance walk but not yet replaced.

## Lessons Learned

GND-CONT should gate LOAD-FLOW initiation automatically rather than relying
on a human pre-check step, especially during schedule-compressed loading
windows where time pressure is the exact condition under which manual steps
get skipped.
