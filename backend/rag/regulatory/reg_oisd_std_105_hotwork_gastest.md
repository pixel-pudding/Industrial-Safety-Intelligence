---
standard: OISD-STD-105
title: Work Permit System (Revision I, September 2004)
issuing_body: Oil Industry Safety Directorate (OISD), Ministry of Petroleum & Natural Gas, Government of India
clause_topic: Hot work permit — gas testing prerequisite
source_url: https://www.oisd.gov.in
retrieved: 2026-07-20
tags: [hot_work, gas_test, permit_to_work, explosive_meter, confined_space]
---

## Verbatim excerpt

> "Gas test for hydrocarbon, oxygen deficiency, toxic gases etc shall be
> conducted as a pre-requisite to issue permit for hot work / vessel entry."

> "No hot work should be permitted unless the Explosive meter reading is
> zero."

> "No hot / cold job shall be undertaken without a work permit except in the
> areas pre-determined and designated by the owner-in-charge."

> "Composite Permit may be used for the various jobs such as hot work
> outside the confined space, entry to confined space and cold / hot work
> inside the confined space."

## Relevance to SPSCL platform

OISD-STD-105 requires a gas test (VOC/hydrocarbon, oxygen, toxic gas) as a
**pre-requisite at issuance** for any hot work or vessel-entry permit, with
a zero-reading explosive-meter threshold. This is the regulatory basis for
the `gas_test_ppm` / `gas_test_pass` fields on the `hot_work` and
`confined_space_entry` permit types. It does not, on its own, require
continuous re-testing after issuance — see
`reg_oisd_std_105_permit_validity.md` for the validity/monitoring clause
that governs conditions drifting after approval, which is the specific
compliance gap Scenario 5 (and the flagship Scenario 10) is built to
demonstrate detection of.
