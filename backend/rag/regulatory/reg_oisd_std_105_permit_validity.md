---
standard: OISD-STD-105
title: Work Permit System (Revision I, September 2004)
issuing_body: Oil Industry Safety Directorate (OISD), Ministry of Petroleum & Natural Gas, Government of India
clause_topic: Permit validity, revalidation, and gas monitoring during work
source_url: https://www.oisd.gov.in
retrieved: 2026-07-20
tags: [hot_work, permit_validity, revalidation, gas_monitoring, shift_handover]
---

## Verbatim excerpt

> "Permits should be issued only for a single shift and their validity
> should expire at the termination of the shift. Where the work has to be
> continued, the same permit may be revalidated/extended shift wise for a
> period not exceeding seven calendar days in the succeeding shifts by
> authorized person after satisfying the permit conditions."

> "Where gas-free conditions are not fully ensured for the duration of hot
> work, a system of monitoring either by automatic or by manual periodic
> verification shall be resorted to depending upon the prevalent conditions
> of the operating area."

## Relevance to SPSCL platform

Two provisions matter here for the Digital Permit Intelligence Agent.
First, permits are shift-scoped and must be **revalidated** at each shift
change against then-current conditions — this is the regulatory hook for
Scenario 9 (shift changeover gap) and Incident 08: a permit or flagged
condition carried across a shift boundary without re-verification is a
compliance gap, not just an operational one. Second, where gas-free
conditions aren't fully ensured, OISD requires *periodic verification* for
the work's duration — the standard anticipates that conditions can drift
and requires monitoring, but leaves the monitoring cadence to site
procedure. The platform's contribution is making that monitoring
continuous and automatic against live VOC-CONC/CL2-CONC readings rather
than periodic-manual, directly targeting the gap documented in Incident 04
and the flagship Incident 10.
