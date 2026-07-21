# Incident 01 — Reactor Overheating Near-Miss

**Zone:** A (Reactor Block) · **Date:** 2021-03-14 · **Severity:** Near-miss
**Hazard category:** Thermal runaway precursor
**Contributing factors:** cooling water flow reduction, delayed operator response, catalyst near end-of-life

## Narrative

RX-TEMP climbed from 255°C to 279°C over roughly 40 minutes after COOL-FLOW
dropped following a partial blockage in the reactor cooling jacket strainer.
The catalyst was 172 days in service — near the 180-day critical threshold —
which raised the reactor's baseline exotherm and meant the same flow loss
produced a faster temperature climb than it would have earlier in the
catalyst's life. The Zone A operator noticed the RX-TEMP trend on SCADA but
assumed transient sensor noise for the first 15 minutes before escalating.
Emergency cooling water injection brought the temperature back to 268°C,
avoiding a Warning-to-Critical crossover into runaway territory. No injuries,
no release.

## Root Cause

Strainer fouling was not caught by the preventive maintenance interval.
Single-signal monitoring — watching RX-TEMP alone — delayed recognition that
catalyst age was compounding the cooling loss; the same COOL-FLOW drop would
have been far less dangerous with a fresh catalyst charge.

## Lessons Learned

Cross-reference COOL-FLOW drift against CAT-AGE when evaluating RX-TEMP
trends — the same flow reduction is materially more dangerous late in
catalyst life than early. Reduce the cooling jacket strainer inspection
interval from 180 to 90 days.
