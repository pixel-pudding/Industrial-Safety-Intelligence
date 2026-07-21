# Incident 10 — Fatal Explosion (Composite Pattern)

**Zones:** A, C, D (with a contributing failure originating in K) · **Date:** 2018-04-11
**Severity:** Fatal · **Hazard category:** Vapor explosion / fire, compound cascade
**Contributing factors:** VOC concentration drift, hot work permit issued and not re-validated, overdue grounding/maintenance record, workers present in the affected zone, skipped nitrogen inerting cycle

*Fictionalized reconstruction, structurally representative of the compound-failure
pattern documented in Indian chemical-corridor incident investigations. Built as the
platform's flagship demonstration case — not a record of a specific real event.*

## Narrative

The sequence began quietly, in a zone no single sensor was watching closely
enough on its own.

**06:50** — A hot work permit was issued for grinding work on a support
bracket at the Zone D blending line, adjacent to the Zone C tank farm fence
line. The gas test at issuance read VOC-CONC at 6% LEL — Normal. The permit
was valid through 14:00 with no continuous re-test condition attached.

**09:10** — A scheduled EO transfer from Zone A into the Zone C storage
tank began. Zone C's relief and vapor-recovery system had an open,
unresolved CMMS work order: the vapor recovery blower had been overdue for
service by 41 days, well past its criticality-rated interval, with no
compensating control in place. Recovery efficiency was degraded but not
zero, so no single reading crossed a hard threshold yet.

**10:05** — VOC-CONC at the Zone C/D boundary began climbing past 10% LEL
into Warning range as vapor recovery underperformed during the transfer.
The hot work permit in Zone D, still active from 06:50, was not
automatically re-checked against this reading — the gap the platform's
Digital Permit Intelligence Agent exists to close.

**10:40** — Separately, at Zone K, a nitrogen inerting cycle scheduled
ahead of unrelated maintenance on a connected vent line was interrupted and
logged as complete without the full purge duration elapsing — the same
gap later formally identified in Incident 07's near-miss, which occurred
after this event and led directly to the hard-block policy change.
Because K's purge state was not cross-checked against Zone C's rising
vapor concentration, the inerting barrier that would normally have reduced
ignition-source risk in the vapor path was silently absent.

**11:15** — VOC-CONC crossed 25% LEL — Critical — at the Zone C/D
boundary. By this point four contractors and two operators were present in
Zone D for the still-active hot work, plus routine blending-line duties.
Grinding resumed after a scheduled break at 11:20, five minutes after the
Critical crossing, because the permit's paper status had never changed:
approved that morning, still approved now.

**11:24** — Vapor ignition occurred at the grinding location. The
resulting flash fire and secondary vessel overpressure in the adjacent
Zone C tank caused a partial structural failure. Three workers were fatally
injured; five sustained serious injuries. Emergency response and
evacuation of the wider zone limited further casualties.

## Root Cause

No single signal was ever, by itself, unambiguous enough to trigger a hard
stop under threshold-only monitoring: the VOC drift was gradual, the
maintenance overdue status was an isolated CMMS flag, the permit was
correctly issued at the time, worker presence was routine, and the inerting
gap was invisible without cross-referencing Zone K against Zone C. It was
the **combination** of five independent, individually-subthreshold-or-normal
signals — vapor concentration drift, an unrevalidated hot work permit,
overdue vapor-recovery maintenance, workers present in the affected zone,
and a silently skipped inerting cycle — that produced a fatal outcome. Each
one was survivable alone; together, in the same time window and adjoining
zones, they were not.

## Lessons Learned

This incident is the structural template for the platform's core thesis:
compound risk detection must reason across sensor, permit, maintenance,
location, and safety-barrier signals simultaneously, not evaluate each in
isolation. A system that only checked "is any single reading in Critical?"
would have found nothing to alert on until the moment of ignition. A system
that cross-references active permits against live gas readings, overdue
maintenance against the equipment it affects, worker location against
permit zones, and safety-barrier status (like nitrogen inerting) against
downstream vapor risk — continuously, not just at issuance — would have
had a multi-signal Warning condition visible starting around 10:05, more
than an hour before ignition. That lead time is the entire value
proposition of the Compound Risk Detection Engine.
