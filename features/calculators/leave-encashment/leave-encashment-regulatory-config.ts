export type LeaveEncashmentOfficialSource = Readonly<{
  id: "notification" | "pib-release" | "act-provision"
  title: string
  issuingAuthority: string
  url: string
  publicationOrEffectiveDate: string
  checkedOn: string
  ruleUsed: string
}>

export const LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE = "2026-07-22"

/**
 * Regulatory-config pattern used: a single feature-local statutory constant plus cited official
 * sources, following gratuity-regulatory-config.ts — NOT the lib/tax/rules / lib/hra/rules
 * FY-versioned rule-set registry (getHraRuleSet(financialYear) etc.), and NOT EPF/PPF's
 * single-value *illustrative* config (epf-rate-config.ts).
 *
 * Why not lib/tax/rules or lib/hra/rules: those registries exist for BINDING statutory
 * computations with several interdependent parameters that actually vary release-to-release
 * within this app — new-regime/old-regime tax slabs, rebate thresholds, and surcharge tiers per
 * financial year; HRA's metro-city list, which is itself scheduled to change again in FY2026-27
 * (see lib/hra/rules/README.md). Section 10(10AA) has exactly one figure that changes rarely —
 * ₹3,00,000 → ₹25,00,000, once, via CBDT Notification No. 31/2023 effective 1 April 2023 — and
 * this calculator never needs to look up a *different* financial year's value to perform a
 * computation; there is one current, binding figure. That is structurally identical to
 * gratuity's ₹20 lakh ceiling in gratuity-regulatory-config.ts, which is the actual precedent
 * this file follows, rather than the multi-parameter FY-lookup registries.
 *
 * Why not EPF/PPF's editable single-value config: that pattern (see epf-rate-config.ts's own
 * comment) is for a number the UI explicitly invites the user to override as an illustrative
 * *assumption* (EPF's projection interest rate) — not a claim anyone relies on for a filing.
 * The ₹25 lakh cap is the opposite case on both axes EPF's comment names: it is a binding
 * statutory limit the user cannot edit, exactly the gratuity-ceiling side of the spectrum that
 * comment contrasts itself against.
 *
 * Revisit trigger: promote this to a versioned-by-FY registry only if a second, independently
 * varying statutory parameter is added to this calculator (mirroring the EPF rate-config
 * comment's own revisit condition) — not merely because the ₹25 lakh figure itself changes
 * again, which this file alone can absorb the same way gratuity's ceiling does.
 */
export const LEAVE_ENCASHMENT_STATUTORY_LIMIT = 2_500_000

/** Explanation 2 to section 10(10AA)(ii): leave standing to an employee's credit counts toward
 * the exemption at a maximum of 30 days for every year of completed service, regardless of the
 * employer's actual annual leave-earning rate. */
export const LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR = 30

export const LEAVE_ENCASHMENT_OFFICIAL_SOURCES: readonly LeaveEncashmentOfficialSource[] = [
  {
    id: "notification",
    title: "CBDT Notification No. 31/2023 [F. No. 200/3/2023-ITA-I]",
    issuingAuthority: "Central Board of Direct Taxes, Ministry of Finance, Government of India",
    url: "https://incometaxindia.gov.in/communications/notification/notification-31-2023.pdf",
    publicationOrEffectiveDate: "Notified 2023-05-24; effective 2023-04-01 (FY 2023-24 onward)",
    checkedOn: LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE,
    ruleUsed: "Raises the section 10(10AA)(ii) aggregate exemption limit for non-government employees from ₹3,00,000 to ₹25,00,000; confirmed unchanged for FY 2026-27 as of this review.",
  },
  {
    id: "pib-release",
    title: "Increased limit for tax exemption on leave encashment for non-government salaried employees notified",
    issuingAuthority: "Press Information Bureau, Ministry of Finance, Government of India",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1927265",
    publicationOrEffectiveDate: "2023-05-24",
    checkedOn: LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE,
    ruleUsed: "Confirms the ₹25 lakh limit is an aggregate cap that applies even when leave encashment is received from more than one employer in the same previous year.",
  },
  {
    id: "act-provision",
    title: "Income-tax Act, 1961 — Section 10(10AA)",
    issuingAuthority: "Ministry of Law and Justice (Legislative Department), Government of India",
    url: "https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx",
    publicationOrEffectiveDate: "Sub-clause (i) unaffected by the 2023 non-government revision",
    checkedOn: LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE,
    ruleUsed: "Sub-clause (i): leave encashment received by a Central or State Government employee at retirement is fully exempt from tax with no monetary ceiling. Sub-clause (ii) and Explanation 2 supply the non-government least-of-four formula, including the 30-days-per-year leave-credit cap. Leave encashed while still in service (not at retirement or resignation) is fully taxable as salary for every employee type and is outside this calculator's scope.",
  },
] as const
