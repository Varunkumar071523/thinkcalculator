export type EPFRateConfiguration = Readonly<{
  defaultRate: number
  label: string
  financialYear: string
  checkedOn: string
  sourceTitle: string
  issuingAuthority: string
  verificationNote: string
  maintenanceNote: string
}>

/** Reference default only — see verificationNote. Mirrors the lightweight PPF_RATE_CONFIG pattern
 * (features/calculators/ppf/ppf-rate-config.ts) — a single-file, single-parameter config — rather
 * than either gratuity's heavier multi-source regulatory-config or the versioned-by-financial-year
 * `lib/tax/rules`/`lib/hra/rules` architecture (decision 24; also used for the Income-tax Rules,
 * 2026 metro-city change via `lib/hra/rules`, see hra-regulatory-config.ts).
 *
 * That heavier architecture exists for BINDING statutory computations with several interdependent
 * parameters per year (tax slabs, rebate thresholds, surcharge tiers, HRA's metro city list) where
 * a wrong number produces a wrong filing figure the user relies on. This calculator's rate is the
 * opposite case on both axes: it is a single float, and it is explicitly an editable *illustrative
 * assumption* the user is invited to change via the slider — the UI and every piece of copy
 * referencing it (epf-content.ts, epf-knowledge-content.ts) says so — not a value anyone is meant
 * to rely on for a filing or statutory claim. Introducing a `lib/epf/rules/fyYYYY-YY.ts` registry
 * for one mutable number the user can already override would be infrastructure this feature has no
 * need for (the same reasoning calculate-retirement.ts's SWP-reuse decision documents for a
 * different pair of features). If EPF ever grows a second or third statutory, non-editable number
 * (e.g. a real EPS-split model with its own wage ceiling), revisit this and consider promoting to
 * the versioned-rules pattern at that point — not before. */
export const EPF_RATE_CONFIG: EPFRateConfiguration = {
  defaultRate: 8.25,
  label: "Reference projection rate",
  financialYear: "FY 2025-26",
  checkedOn: "2026-07-21",
  sourceTitle: "EPFO notification of the interest rate for FY 2025-26, per Ministry of Labour & Employment approval under the EPF Scheme, 1952",
  issuingAuthority: "Employees' Provident Fund Organisation, Ministry of Labour & Employment",
  verificationNote: "8.25% was notified for FY 2025-26 — unchanged from FY 2024-25 and FY 2023-24 (verified: this is the third consecutive year at this rate), with interest expected to be credited to member passbooks around 15 July 2026. This is a reference default for the editable rate slider, not a claim about the currently notified rate — EPFO declares a rate annually and it can change.",
  maintenanceNote: "For a new EPFO-declared rate, update this object's default, financial year, checked date, and notes together, then review visible input/result copy, the worked example, and tests before rerunning the full quality gate.",
}
