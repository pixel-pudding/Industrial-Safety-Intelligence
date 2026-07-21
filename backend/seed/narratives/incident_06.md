# Incident 06 — Cooling Tower Failure Cascading Event

**Zones:** F -> A & B · **Date:** 2023-05-09 · **Severity:** Moderate
**Hazard category:** Cascading utility failure
**Contributing factors:** cooling tower fan motor failure, simultaneous demand from Zones A and B, no redundant cooling path visibility

## Narrative

A cooling tower fan motor in Zone F failed during a hot afternoon, causing
CT-OUTTEMP to climb from 31°C to 41°C over 25 minutes. Because the same
cooling loop feeds both the Zone A reactor cooling jacket and the Zone B
chlorine compressor cooling water, COOL-FLOW in Zone A began degrading at
the same time COMP-VIB in Zone B started trending upward from reduced
cooling water flow. Neither zone's operator could see the other zone's
degradation, and each independently assumed a local equipment issue until
the Zone F fault was identified twenty minutes in. A backup fan was engaged
manually; both zones recovered without reaching Critical tier.

## Root Cause

A single utility fault with no shared visibility across the two zones it
fed, which delayed root-cause identification because each zone's operator
was reasoning from an incomplete, single-zone view of the plant.

## Lessons Learned

This is the clearest "no single sensor sees this" case in the plant's
history — one utility-block signal degrading two unrelated zones
simultaneously is only diagnosable with cross-zone correlation. It is the
core justification for a Compound Risk Detection Engine that reasons across
zones rather than monitoring each in isolation.
