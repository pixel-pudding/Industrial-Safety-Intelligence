# Incident 03 — Tank Overpressure Event

**Zone:** C (Tank Farm) · **Date:** 2022-01-19 · **Severity:** Moderate
**Hazard category:** Overpressure
**Contributing factors:** relief valve partially seized, overfill during Zone A high-output period, delayed operator round

## Narrative

Following a high-throughput production run in Zone A, TK-LEVEL in the EO
storage tank climbed to 97% while TK-PRESS rose to 5.4 bar — past the 5 bar
Critical threshold. The primary pressure relief valve was later found
partially seized from an earlier missed inspection. Zone C operator rounds,
normally hourly, had been extended to 90 minutes that shift due to
short-staffing, delaying detection of the climbing level. Manual venting
through the secondary relief path brought pressure down before the tank's
structural design threshold was approached. No release, no injuries.

## Root Cause

The relief valve inspection was overdue by 34 days at the time of the
event — a CMMS record that existed but was never cross-referenced against
the live TK-PRESS trend. Staffing-driven round extension removed the human
redundancy that would normally have caught the level climb earlier.

## Lessons Learned

Overdue relief-valve maintenance on a tank should raise the effective risk
tier of that tank's pressure readings rather than sitting as an isolated
CMMS flag disconnected from live sensor data — this incident is the direct
precedent for treating overdue maintenance as a risk multiplier on top of
sensor-driven scoring, never as an independent trigger on its own.
