export type CapitalGainsOfficialSource = Readonly<{
  id: "amending-act" | "cbdt-circular" | "act-provision"
  title: string
  issuingAuthority: string
  url: string
  publicationOrEffectiveDate: string
  checkedOn: string
  ruleUsed: string
}>

export const CAPITAL_GAINS_REGULATORY_REVIEW_DATE = "2026-07-24"

/**
 * Regulatory-config pattern used: a single feature-local set of statutory constants plus cited
 * official sources — the same gratuity/leave-encashment-style pattern, NOT the lib/tax/rules
 * FY-versioned TaxRuleSet registry, and NOT EPF/PPF's single-value *illustrative* config
 * (ppf-rate-config.ts).
 *
 * Why not lib/tax/rules's FY-versioned registry: that registry exists for a BINDING computation
 * with several parameters that are genuinely interdependent and vary release-to-release within
 * one financial year's rules — old-regime vs new-regime slab bands, a rebate threshold, and a
 * tiered surcharge schedule that must all be read together to produce one number
 * (lib/tax/rules/fy2025-26.ts's TaxRuleSet shape). This calculator has exactly three figures —
 * the section 111A STCG rate (20%), the section 112A LTCG rate (12.5%), and the section 112A
 * annual exemption (₹1,25,000) — and they do not vary against each other by financial year the
 * way slab bands do: all three were set together by the Finance (No. 2) Act, 2024 for transfers
 * on or after 23 July 2024, and lib/tax/rules/README.md already documents these as explicitly
 * *out of scope* for the income-tax engine ("the 111A/112/112A special-rate surcharge cap...
 * not modelled"), i.e. this is deliberately a separate, smaller regulatory surface, not an
 * extension of that registry. There is also no need for this calculator to ever look up a
 * *different* financial year's rate to perform a computation — there is one current, binding set
 * of figures, which is structurally identical to gratuity's ₹20 lakh ceiling and leave
 * encashment's ₹25 lakh limit, the actual precedent this file follows.
 *
 * Why not EPF/PPF's editable single-value config: that pattern is for a number the UI explicitly
 * invites the user to override as an illustrative *assumption* (a projected interest rate) — not
 * a claim anyone relies on for a filing. The STCG/LTCG rates and the exemption cap are the
 * opposite case: binding statutory figures the user cannot edit.
 *
 * The pre-31-January-2018 grandfathering cost-basis rule (Finance Act, 2018, inserting section
 * 112A) is tracked separately below since it is a distinct provision from the July 2024 rate
 * change — it affects only cost basis, not the tax rate or the exemption — but it is the same
 * "one current, binding, rarely-revisited figure" shape, so it lives in this same file rather
 * than a second config module.
 *
 * Revisit trigger: promote this to a versioned-by-FY registry only if a future Budget makes the
 * STCG rate, LTCG rate, or exemption cap independently variable by financial year (e.g. a
 * transition-year blended rate) rather than one Act changing all of them together as it did in
 * 2024 — not merely because one of these figures changes again, which this file alone can absorb
 * the same way gratuity's and leave encashment's ceilings do.
 */
export const CAPITAL_GAINS_STCG_TAX_RATE = 0.20
export const CAPITAL_GAINS_LTCG_TAX_RATE = 0.125
export const CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION = 125_000

/** Holding period threshold: more than 12 months held is long-term (section 2(29A)/112A) for
 * listed equity shares and equity-oriented mutual fund units on which STT has been paid; 12
 * months or less is short-term (section 111A). */
export const CAPITAL_GAINS_LONG_TERM_HOLDING_MONTHS = 12

/** Cost-basis grandfathering cutoff introduced by the Finance Act, 2018 alongside section 112A —
 * a lot acquired strictly before this date uses the higher-of/lower-of cost-basis rule instead
 * of its actual cost of acquisition. This date itself is not expected to ever change. */
export const CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE = "2018-01-31"

export const CAPITAL_GAINS_OFFICIAL_SOURCES: readonly CapitalGainsOfficialSource[] = [
  {
    id: "amending-act",
    title: "Finance (No. 2) Act, 2024 — sections 111A and 112A amendments",
    issuingAuthority: "Ministry of Law and Justice (Legislative Department), Government of India",
    url: "https://incometaxindia.gov.in/pages/acts/finance-acts.aspx",
    publicationOrEffectiveDate: "Enacted 2024-08-16; STCG/LTCG rate and exemption changes effective for transfers on or after 2024-07-23",
    checkedOn: CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
    ruleUsed: "Raises the section 111A STCG rate on STT-paid listed equity shares and equity-oriented mutual fund units to 20% (from 15%), raises the section 112A LTCG rate to 12.5% (from 10%, without indexation), and raises the section 112A annual exemption to ₹1,25,000 (from ₹1,00,000); confirmed unchanged through FY 2026-27 per Budget 2025 and Budget 2026 as of this review.",
  },
  {
    id: "cbdt-circular",
    title: "CBDT Circular No. 4/2018 — Frequently Asked Questions on computation of long-term capital gains under section 112A",
    issuingAuthority: "Central Board of Direct Taxes, Ministry of Finance, Government of India",
    url: "https://incometaxindia.gov.in/communications/circular/circular-4-2018.pdf",
    publicationOrEffectiveDate: "2018-02-04",
    checkedOn: CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
    ruleUsed: "Clarifies the grandfathering computation for equity shares/units acquired before 31 January 2018: cost of acquisition is the higher of (a) actual cost of acquisition, and (b) the lower of (i) fair market value as on 31 January 2018, and (ii) the full value of consideration received on transfer. This provision affects cost basis only, is independent of the 2024 rate change, and is unaffected by it.",
  },
  {
    id: "act-provision",
    title: "Income-tax Act, 1961 — sections 111A and 112A",
    issuingAuthority: "Ministry of Law and Justice (Legislative Department), Government of India",
    url: "https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx",
    publicationOrEffectiveDate: "Section 112A inserted by the Finance Act, 2018, effective assessment year 2019-20; both sections amended by the Finance (No. 2) Act, 2024",
    checkedOn: CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
    ruleUsed: "Section 111A taxes short-term capital gains (holding period 12 months or less) on STT-paid listed equity shares and equity-oriented mutual fund units at a flat rate with no exemption threshold. Section 112A taxes long-term capital gains (holding period more than 12 months) on the same instruments at a flat rate without indexation, after an annual pooled exemption. Both sections apply only where securities transaction tax has been paid on the transaction (subject to notified exceptions), which this calculator assumes and does not independently verify.",
  },
] as const
