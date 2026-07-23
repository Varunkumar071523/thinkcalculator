export type EpsPensionOfficialSource = Readonly<{
  id: "gazette-notification" | "predecessor-scheme-text" | "amendment-notification" | "parliament-reply"
  title: string
  issuingAuthority: string
  url: string
  publicationOrEffectiveDate: string
  checkedOn: string
  ruleUsed: string
}>

export const EPS_PENSION_REGULATORY_REVIEW_DATE = "2026-07-22"

/**
 * Regulatory-config pattern used: a single feature-local statutory-constants file plus cited
 * official sources, following gratuity-regulatory-config.ts and
 * leave-encashment-regulatory-config.ts — NOT the lib/tax/rules / lib/hra/rules FY-versioned
 * rule-set registry, and NOT EPF/PPF's single-value *illustrative* config (epf-rate-config.ts).
 *
 * Why not lib/tax/rules or lib/hra/rules: this calculator has no parameter that varies by
 * financial year and needs a per-FY lookup. Every figure below — the ₹15,000 pensionable-salary
 * ceiling, the ₹1,000 minimum pension, the 70 divisor, the 10-year eligibility floor, the 20-year/
 * 2-year bonus-service weightage, and the 50-year early-pension floor with its 4%-per-year
 * reduction — has been a single, static number since the Employees' Pension (Amendment) Scheme,
 * 2014 (wage ceiling and minimum pension) or since the original 1995 scheme text (everything
 * else), and this calculator never needs a *different* year's value to compute a result. That is
 * structurally identical to gratuity's ₹20 lakh ceiling and leave encashment's ₹25 lakh limit —
 * the actual precedent this file follows.
 *
 * Why not EPF/PPF's editable single-value config: that pattern is for a number the UI explicitly
 * invites the user to override as an illustrative *assumption* (EPF's projection interest rate).
 * Every figure here is a binding statutory parameter the user cannot edit — the gratuity-ceiling
 * side of the spectrum that comment contrasts itself against, not the EPF-rate side.
 *
 * Revisit trigger: promote this to a versioned-by-FY registry only if a second, independently
 * varying statutory parameter is added to this calculator — not merely because one of the figures
 * below changes again, which this file alone can absorb the same way gratuity's ceiling does.
 *
 * EPS 2026 rename (follow-up sprint, decided): this calculator now names and cites the Employees'
 * Pension Scheme, 2026 (EPS 2026) — gazetted 29 June 2026 under the Code on Social Security, 2020
 * (G.S.R. 525(E)/526(E)/527(E)) — as the current governing scheme, superseding the Employees'
 * Pension Scheme, 1995 (EPS 1995) and the Employees' Family Pension Scheme, 1971. This is
 * corroborated by multiple independent, credible sources (a legal publisher's case note, a
 * law-firm client alert citing the same gazette numbers, and mainstream financial media), all of
 * which agree the formula and every figure below carried over unchanged from EPS 1995 into EPS
 * 2026 — so the id: "gazette-notification" source below is now the primary citation, and
 * id: "predecessor-scheme-text" is kept only as provenance for the paragraph-12 formula language
 * EPS 2026 inherited, not as the governing document. This sprint did not re-verify whether EPS
 * 2026's own text renumbers paragraph 12/12(7) — the predecessor and parliament-reply sources below
 * are cited by their original EPS 1995 paragraph numbers for that reason; a future sprint should
 * confirm the EPS 2026 gazette text's own paragraph numbering if that level of citation precision
 * is needed.
 */
export const EPS_PENSION_WAGE_CEILING = 15_000
export const EPS_PENSION_MINIMUM_MONTHLY_PENSION = 1_000
export const EPS_PENSION_DIVISOR = 70
export const EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS = 10
export const EPS_PENSION_STANDARD_RETIREMENT_AGE = 58
export const EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS = 20
export const EPS_PENSION_BONUS_SERVICE_YEARS = 2
export const EPS_PENSION_EARLY_PENSION_MIN_AGE = 50
export const EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR = 4

export const EPS_PENSION_OFFICIAL_SOURCES: readonly EpsPensionOfficialSource[] = [
  {
    id: "gazette-notification",
    title: "Employees' Pension Scheme, 2026 — gazette notifications G.S.R. 525(E)/526(E)/527(E)",
    issuingAuthority: "Ministry of Labour & Employment, Government of India, under the Code on Social Security, 2020",
    url: "https://labour.gov.in/",
    publicationOrEffectiveDate: "Gazetted 2026-06-29; in force from that date",
    checkedOn: EPS_PENSION_REGULATORY_REVIEW_DATE,
    ruleUsed: "Current governing instrument for this calculator: EPS 2026 supersedes the Employees' Pension Scheme, 1995 (EPS 1995) and the Employees' Family Pension Scheme, 1971. Multiple independent sources (legal publisher, law-firm client alert, mainstream financial media) confirm the monthly-pension formula, the ₹15,000 wage ceiling, the ₹1,000 minimum pension, the 20-year/2-year bonus-service weightage, and the 10-year eligibility floor all carry over unchanged from EPS 1995.",
  },
  {
    id: "predecessor-scheme-text",
    title: "The Employees' Pension Scheme, 1995 (as amended) — Paragraph 12 [superseded by EPS 2026; provisions carried over]",
    issuingAuthority: "Employees' Provident Fund Organisation, Ministry of Labour & Employment, Government of India",
    url: "https://www.epfindia.gov.in/site_docs/PDFs/Downloads_PDFs/EPS95.pdf",
    publicationOrEffectiveDate: "Scheme in force 1995-11-16 to 2026-06-28, under section 6A of the EPF & MP Act, 1952",
    checkedOn: EPS_PENSION_REGULATORY_REVIEW_DATE,
    ruleUsed: "Provenance source, not the current governing document: paragraph 12 originated the monthly-pension formula (pensionable salary × pensionable service ÷ 70), the 10-year minimum-service eligibility, standard retirement age 58, and the 2-year weightage for 20+ years of pensionable service — all retained by EPS 2026 per the gazette-notification source above.",
  },
  {
    id: "amendment-notification",
    title: "Employees' Pension (Amendment) Scheme, 2014 [G.S.R. 609(E)]",
    issuingAuthority: "Ministry of Labour & Employment, Government of India",
    url: "https://www.epfindia.gov.in/site_docs/PDFs/EPFO_Notifications_2016_2017/EPS_Amendment_2014.pdf",
    publicationOrEffectiveDate: "Notified 2014-08-22; effective 2014-09-01",
    checkedOn: EPS_PENSION_REGULATORY_REVIEW_DATE,
    ruleUsed: "Raised the pensionable-salary wage ceiling from ₹6,500 to ₹15,000/month and introduced the ₹1,000/month minimum monthly pension floor under EPS 1995; both figures are retained unchanged under EPS 2026.",
  },
  {
    id: "parliament-reply",
    title: "Rajya Sabha unstarred question — early pension under EPS 1995, paragraph 12(7)",
    issuingAuthority: "Ministry of Labour & Employment, Government of India (reply by Minister of State Shobha Karandlaje)",
    url: "https://labour.gov.in/whatsnew/parliament-questions",
    publicationOrEffectiveDate: "2026-02-12",
    checkedOn: EPS_PENSION_REGULATORY_REVIEW_DATE,
    ruleUsed: "Confirms paragraph 12(7) of the then-current EPS 1995 allowed a member with eligible pensionable service to draw an early pension from age 50, with the pension reduced 4% for every year the age falls short of 58 — the same reduction rule this calculator applies under EPS 2026.",
  },
] as const
