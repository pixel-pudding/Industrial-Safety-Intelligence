# Incident 07 — Skipped Inerting Cycle Near-Miss

**Zone:** K (Flare Stack & Nitrogen Inerting) · **Date:** 2022-09-30 · **Severity:** Near-miss
**Hazard category:** Uncontrolled venting / confined space exposure precursor
**Contributing factors:** N2 purge cycle skipped under time pressure, confined space entry request pending, CMMS work order backlog

## Narrative

A confined space entry request for internal inspection of a vessel
connected to the Zone K flare system was submitted while the mandatory
nitrogen purge cycle was still logged as "in progress." Due to a
scheduling backlog, the purge work order was administratively marked
complete without the full cycle duration elapsing, and entry was nearly
authorized on that basis. A safety officer cross-checking the N2-PURGE
system log directly — rather than trusting the CMMS work-order status alone
— caught the discrepancy: the logged purge duration did not match actual
completion time. Entry was blocked pending a verified re-purge. No entry
occurred; no exposure.

## Root Cause

The CMMS work-order status and the underlying N2-PURGE system state were
treated as equivalent when they are not — a work order can be marked
complete without the physical purge process having actually finished.

## Lessons Learned

Confined space entry authorization must verify against the live N2-PURGE
system state directly, not the CMMS work-order status field, which can be
updated independently of physical completion. This incident is the direct
precedent for treating a skipped or unverified inerting cycle as a hard
permit-blocking condition, not just a flag.
