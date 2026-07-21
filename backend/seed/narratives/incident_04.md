# Incident 04 — Hot Work Ignition Near-Miss

**Zone:** D (Solvent Blending & Packaging) · **Date:** 2021-11-05 · **Severity:** Near-miss
**Hazard category:** Fire/explosion precursor
**Contributing factors:** hot work permit approved before shift change, VOC drift after approval, no continuous re-test requirement

## Narrative

A hot work permit for grinding on a blending line support bracket was
approved at 06:40 with a clean gas test (VOC-CONC at 4% LEL, well within
Normal). By 08:15, a nearby product transfer from Zone C had raised local
VOC-CONC to 14% LEL — into Warning range — but the permit remained active
with no automatic re-test requirement built into its validity window. A
contractor noticed the smell of solvent vapor and independently stopped work
roughly two minutes before scheduled grinding was due to resume. No
ignition occurred.

## Root Cause

The permit's gas test was a point-in-time check performed at issuance, with
no continuous re-validation against live VOC-CONC for the remainder of the
permit's validity window. This is exactly the ePTW gap the platform's
Digital Permit Intelligence Agent is designed to close: permits are
validated at issuance only, and conditions can drift dangerous afterward.

## Lessons Learned

Hot work permits must be continuously cross-checked against live gas
readings for their entire validity window, with an automatic stop-work
recommendation the moment conditions drift into Warning or above — not left
to a worker independently noticing the smell of vapor.
