# Tax rule sets

Each file in this folder (e.g. `fy2025-26.ts`) is a versioned, typed
`TaxRuleSet` for one financial year, registered by FY string in `index.ts`.
Calculation logic in `lib/tax/engine.ts` never hardcodes a rate, threshold,
or cap — it only reads from a `TaxRuleSet` looked up by financial year. This
lets a new Budget be added as a new file without touching calculation logic
(see [docs/DECISIONS.md](../../../docs/DECISIONS.md) for the rationale).

## Sources — FY 2025-26 (AY 2026-27)

Figures below reflect the provisions announced in the Union Budget 2025
(presented 1 February 2025) and Finance Act, 2025, effective from
1 April 2025.

| Figure | Provision |
| --- | --- |
| New regime slabs | Sec 115BAC(1A), Income-tax Act, 1961, as amended by Finance Act 2025 |
| New regime standard deduction (₹75,000) | Sec 16(ia) read with Sec 115BAC(2) |
| New regime Sec 87A rebate (threshold ₹12,00,000, cap ₹60,000) + marginal relief | Sec 87A as amended by Finance Act 2025, provisos thereto |
| Old regime slabs (by age band) | Part III, First Schedule, Finance Act — unchanged since Finance Act 2023 |
| Old regime standard deduction (₹50,000) | Sec 16(ia) |
| Old regime Sec 87A rebate (threshold ₹5,00,000, cap ₹12,500) | Sec 87A, original/unchanged provision |
| Surcharge thresholds and rates | Part I, First Schedule, Finance Act 2025 |
| New regime surcharge capped at 25% (no 37% tier) | Proviso limiting surcharge for income chargeable u/s 115BAC(1A), continuing from Finance Act 2023 |
| Surcharge marginal relief | Second proviso, Paragraph A, Part I, First Schedule |
| Health & Education Cess (4%) | Sec 2, annual Finance Act |
| Sec 80C cap (₹1,50,000) | Sec 80CCE combined ceiling for 80C/80CCC/80CCD(1) |
| Sec 80D caps (₹25,000 / ₹50,000) | Sec 80D |
| Sec 24(b) home loan interest cap (₹2,00,000) | Sec 24(b), self-occupied property |

## Verification (Sprint 25, 2026-07-16)

Every figure in `fy2025-26.ts` has been cross-checked against the Income
Tax Department's own AY 2026-27 guidance pages (which state the rates as
currently administered, i.e. post-Finance Act 2025) rather than relying
solely on Budget-speech summaries. Confirmed sources:

- [incometax.gov.in — Salaried Individuals, AY 2026-27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1) —
  new-regime and below-60 old-regime slabs, surcharge table (including the
  new-regime 25% cap vs old-regime 37% top tier above ₹5Cr), the
  Health & Education Cess (4%, both regimes), and both regimes' Sec 87A
  rebate cap/threshold, stated together on one official page.
- [incometax.gov.in — Senior/Super Senior Citizens, AY 2026-27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-2) —
  confirms the `60to80` (nil up to ₹3,00,000) and `80plus` (nil up to
  ₹5,00,000, no 5% slab) old-regime slabs.

All of the following matched the code exactly, with no discrepancies found:

- New regime slabs (₹4L/8L/12L/16L/20L/24L breakpoints, 0/5/10/15/20/25/30%)
- Old regime slabs for all three age bands
- Standard deduction: ₹75,000 (new regime), ₹50,000 (old regime) — the
  Finance (No. 2) Act 2024 proviso to Sec 16(ia) that set the new-regime
  figure carries forward unchanged into FY 2025-26/AY 2026-27
- Sec 87A rebate: new regime threshold ₹12,00,000 / cap ₹60,000; old
  regime threshold ₹5,00,000 / cap ₹12,500; marginal relief behaviour for
  both, as described in the engine
- Surcharge tiers and rates for both regimes, including the new-regime
  25%-cap / no-37%-tier rule
- Cess rate: 4%, both regimes

`section80C` (₹1,50,000), `section80D` (₹25,000 / ₹50,000), and
`homeLoanInterestSection24b` (₹2,00,000) were confirmed as **unchanged**
by Budget 2025 / Finance Act 2025 — these are long-standing figures (80C
unchanged since 2014) and multiple independent 2025-26 tax-guide sources
agree no revision was made. No official incometax.gov.in page states
these three caps as plainly as the slab/rebate/surcharge table above, so
confidence here rests on the absence of any reported change rather than
a single primary-source citation — flagged here rather than presented as
equally certain.

One adjacent, non-blocking note: the "Income Tax Act, 2025" renumbers
sections (e.g. 80C → 123) effective **1 April 2026**, i.e. FY 2026-27 /
AY 2027-28. It has no effect on this FY 2025-26 ruleset; keep it in mind
when a `fy2026-27.ts` file is eventually added, since the section
numbers in that file's comments will need to change, not just the
figures.

When a new Budget changes any of these figures, add a new `fyYYYY-YY.ts`
file and register it in `index.ts` — do not mutate a past year's file.
Aim to do this by ~April of the new financial year, before users start
estimating that year's tax.

## Known simplifications (documented, not bugs)

- **Sec 24(b)** always uses the self-occupied-property cap (₹2,00,000).
  A let-out property has no statutory cap under Sec 24(b); this engine
  does not distinguish occupancy type.
- **Sec 80D** cap is derived only from the taxpayer's own age band. It
  does not add the separate, higher allowance available when the premium
  paid is for senior-citizen parents.
- **Sec 80CCD(2)** (employer NPS, new regime), **HRA exemption**, and the
  generic **"other Section 80-series"** bucket have no single statutory
  ceiling this engine can apply:
  - The real Sec 80CCD(2) cap is 14% of basic salary + DA, which needs a
    salary breakdown this engine does not collect — the caller is expected
    to supply an already-capped amount.
  - HRA exemption is a least-of-three-rules computation (out of scope
    until Sprint 26) — this engine only accepts a pre-computed number.
  - "Other 80-series" deliberately spans many provisions (80E, 80G,
    80TTA, ...) with different individual limits that a single field
    cannot represent.

  Since none of these three can be validated against a fixed statutory
  number, `validateTaxCalcInput` instead enforces a **sanity ceiling: none
  of the three may exceed gross income.** This is a decision, not an
  oversight — a deduction cannot legitimately exceed the income it is
  deducted from, so it catches the obviously-wrong case (e.g. an HRA
  exemption of ₹5 crore on a ₹10 lakh salary) without pretending to
  enforce a statutory limit this engine cannot compute. It does not
  reproduce the real, tighter statutory limits for any of the three.
- Surcharge marginal relief and the 111A/112/112A special-rate surcharge
  cap (capital gains) are not modelled — this engine assumes regular
  slab-rate income only.
