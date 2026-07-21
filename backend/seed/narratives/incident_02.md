# Incident 02 — Chlorine Gas Minor Release

**Zone:** B (Chlor-Alkali Unit) · **Date:** 2020-08-02 · **Severity:** Minor
**Hazard category:** Toxic gas release
**Contributing factors:** compressor seal wear, vibration trend ignored, wind direction toward Zone J

## Narrative

COMP-VIB on the chlorine compressor trended from 3 mm/s to 6.5 mm/s over 11
days without a work order ever being raised — still technically inside the
2–7 mm/s Warning band the whole time, so no single reading ever crossed into
Critical. Seal failure eventually produced a brief CL2-CONC spike to 1.4 ppm
in the cell room, detected by fixed gas sensors. Automatic ventilation and
evacuation of non-essential personnel triggered per SOP. Wind was blowing
toward Zone J (Main Gate) at the time, prompting a precautionary gate-area
check, though perimeter concentration never exceeded background. No
injuries; the release was contained to a controlled venting duration of
approximately six minutes.

## Root Cause

The vibration trend was visible in SCADA history but never crossed an
instantaneous threshold long enough to auto-flag. The *trend itself* — not
a discrete breach — was the leading indicator, and it was missed because
monitoring was threshold-based rather than trend-based.

## Lessons Learned

Compound-risk logic should treat a sustained upward vibration trend as a
risk multiplier even while a tag is still nominally in-range, not only react
to a discrete threshold breach. Wind direction should be logged alongside
gas events for dispersion cross-checks on any future Zone B release.
