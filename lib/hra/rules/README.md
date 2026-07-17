# HRA exemption rule sets

Each file in this folder (e.g. `fy2025-26.ts`) is a versioned, typed
`HraRuleSet` for one financial year, registered by FY string in `index.ts`,
mirroring the pattern in [lib/tax/rules](../../tax/rules/README.md).
Calculation logic in `lib/hra/engine.ts` never hardcodes a percentage or a
metro-city name — it only reads from an `HraRuleSet` looked up by financial
year.

## The rule (Section 10(13A) / Rule 2A)

Exempt HRA is the **least** of:

1. Actual HRA received (annual)
2. Rent paid (annual) minus 10% of salary
3. 50% of salary if the employee lives in a metro city, else 40% of salary

"Salary" for this purpose is basic salary plus dearness allowance, where DA
forms part of retirement benefits (commission that is a fixed percentage of
turnover also counts, but this calculator does not collect commission
income — see Known simplifications below).

This exemption is available **only under the old tax regime** — Section
115BAC (new regime) does not permit it at all, which is why
`lib/tax/types.ts`'s `NewRegimeDeductionInput` has no HRA field.

## Sources — FY 2025-26 (AY 2026-27)

| Figure | Provision |
| --- | --- |
| Three-way least-of computation | Section 10(13A), Income-tax Act, 1961, read with Rule 2A, Income-tax Rules, 1962 |
| Metro cities (Delhi, Mumbai, Kolkata, Chennai) at 50% of salary; all other cities at 40% | Rule 2A(a) |
| Rent paid minus 10% of salary | Rule 2A(b)/(c) |
| Old-regime-only availability | Section 115BAC(2), which does not list Section 10(13A) among the exemptions retained under the new regime |

Confirmed against multiple current tax-guidance sources describing Rule 2A
as it stands for FY 2025-26 (AY 2026-27), including
[ClearTax — House Rent Allowance (HRA)](https://cleartax.in/s/hra-house-rent-allowance)
and [Bajaj Finserv — HRA in the New Tax Regime](https://www.bajajfinserv.in/hra-in-new-tax-regime),
which agree on the four-city list, the 50%/40% split, and old-regime-only
availability for FY 2025-26.

## Why this is pinned to FY 2025-26, not the financial year current at time of writing (Sprint 26, 2026-07-16)

Verification for this sprint surfaced that the four-metro-city list is
**not** a long-standing fixed constant, contrary to the assumption in the
original sprint brief. Multiple 2026 tax-guidance sources — e.g.
[TaxGuru — HRA Exemption: 8 Cities Now Qualify for 50% Exemption](https://taxguru.in/income-tax/hra-exemption-8-cities-qualify-50-percent-exemption-practical-guide.html)
and [Tax Update India — HRA 50% Exemption Now Covers 8 Cities From FY 2026-27](https://taxupdate.in/income-tax/781/hra-50-percent-exemption-8-cities-fy-2026-27-bengaluru-hyderabad-pune-ahmedabad-income-tax-rules-2026/) —
describe the Income-tax Rules, 2026 (which operationalise the Income-tax Act,
2025, effective 1 April 2026) as adding Bengaluru, Pune, Hyderabad, and
Ahmedabad to the 50% metro tier from **FY 2026-27 onward**. FY 2025-26
(the year whose return is currently being filed, due 31 July 2026) keeps the
original four-city list.

This calculator is pinned to FY 2025-26 rather than FY 2026-27 because
`lib/tax`'s income tax engine — the only calculator this one passes its
result into — is itself pinned to FY 2025-26
(`INCOME_TAX_FINANCIAL_YEAR` in `features/calculators/income-tax/income-tax-regulatory-config.ts`).
Computing an HRA exemption under FY 2026-27's 8-city rule and then feeding
it into an FY 2025-26 tax calculation would silently mix two different
years' rules in one result. **A future sprint should add
`fy2026-27.ts` here (8-city list) at the same time the income tax engine
itself gains FY 2026-27 support** — not before, and not as a
disconnected addition to this module alone.

This "the assumption in the brief may be stale — verify anyway" finding
mirrors the note already on record in
[lib/tax/rules/README.md](../../tax/rules/README.md) about the Income Tax
Act, 2025 renumbering sections from FY 2026-27; that note is the same
underlying legislative change surfacing again here for Rule 2A.

## Known simplifications (documented, not bugs)

- **Commission as a percentage of turnover** is part of the statutory
  "salary" definition for Rule 2A but is not collected as a separate input;
  only basic salary and DA are. A commission-earning employee's actual
  exemption may be understated by this calculator.
- **Only one city classification (metro/non-metro) for the full year** is
  supported — no mid-year relocation or period-by-period rent/salary
  changes, per this sprint's scope.
- The **DA "forms part of retirement benefits"** qualifier is not itself
  validated; the calculator accepts whatever DA figure is entered as
  eligible. Salaried employees without qualifying DA should enter 0.
