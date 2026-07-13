import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import {
  GRATUITY_OFFICIAL_SOURCES,
  GRATUITY_REGULATORY_REVIEW_DATE,
  GRATUITY_STATUTORY_CEILING,
} from "./gratuity-regulatory-config"

export const gratuityKnowledgeContent = {
  title: "Understand the statutory gratuity estimate",
  description: "Learn the current Code-based wage and service assumptions, the 15/26 method, the exact six-month boundary, the statutory ceiling, and the legal questions this narrow calculator does not decide.",
  sections: [
    {
      id: "gratuity-meaning",
      title: "What gratuity means",
      type: "overview",
      content: [{ type: "paragraph", text: "Gratuity is a statutory employment benefit that may become payable when qualifying employment ends in an event covered by law. The amount commonly depends on last-drawn eligible wages and completed continuous service, but entitlement and the final employer calculation depend on facts outside a three-input calculator." }],
    },
    {
      id: "gratuity-current-framework",
      title: "Current statutory context",
      type: "overview",
      content: [
        { type: "paragraph", text: `The Code on Social Security, 2020 is the current governing central framework used here. The relevant provisions were brought into force from 21 November 2025. The Social Security (Central) Rules, 2026 were published and took effect on 8 May 2026. Ministry FAQs state that the revised wage definition and Code-based gratuity calculation apply from 21 November 2025, and that gratuity becoming payable on or after that date uses the last-drawn wage under the Code framework. Sources were reviewed on ${GRATUITY_REGULATORY_REVIEW_DATE}.` },
        { type: "callout", variant: "important", title: "A transition date is not a split formula", text: "The Ministry's March 2026 FAQ says service before 21 November 2025 is not separately calculated under the repealed Act when gratuity becomes payable on or after commencement; the last-drawn wage and Code provisions apply. Individual disputes or protected accrued rights still require professional review." },
      ],
    },
    {
      id: "gratuity-inputs",
      title: "What to enter",
      type: "input-guide",
      content: [{ type: "list", style: "numbered", items: [
        "Enter the last-drawn monthly wage amount that payroll or the employer determines is eligible under the Code wage definition.",
        "Enter fully completed years of continuous service.",
        "Enter the remaining fully completed months from 0 to 11; represent 12 months as another completed year.",
        "Calculate and review both the formula amount and the amount after the statutory ceiling.",
      ] }],
    },
    {
      id: "gratuity-wages",
      title: "Eligible wages are not automatically gross salary",
      type: "input-guide",
      content: [
        { type: "paragraph", text: "Section 2(88) defines wages broadly and expressly includes basic pay, dearness allowance, and retaining allowance, if any. It also lists exclusions such as specified bonus, employer pension or provident-fund contributions, conveyance allowance, house-rent allowance, overtime, commission, gratuity, retrenchment compensation, and certain other payments." },
        { type: "paragraph", text: "The first proviso applies a 50% rule: when specified excluded payments exceed half of total remuneration, the excess is added back to wages. Remuneration in kind can also be included within the statutory limit. Because payslips and terms of employment differ, this calculator asks for the already-determined eligible wage figure rather than trying to derive it from gross salary or CTC." },
      ],
    },
    {
      id: "gratuity-method",
      title: "How the standard calculation works",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: "For a regular monthly rated employee, fifteen days' wages are calculated as last-drawn eligible monthly wages divided by 26 and multiplied by 15. That amount is multiplied by the counted service years." },
        { type: "list", style: "numbered", items: ["Daily wage basis = eligible monthly wages ÷ 26.", "Fifteen days' wages = daily wage basis × 15.", "Formula gratuity = fifteen days' wages × counted service years.", "Estimated gratuity = the lower of formula gratuity and the current statutory ceiling."] },
      ],
    },
    {
      id: "gratuity-service-rounding",
      title: "The exact six-month boundary",
      type: "interpretation",
      content: [
        { type: "paragraph", text: "Section 53 uses every completed year of service or part thereof in excess of six months. Therefore, zero through exactly six additional completed months do not add a counted year. Seven through eleven additional completed months add one counted year for this standard formula." },
        { type: "table", caption: "Service-count comparison at ₹50,000 eligible monthly wages", headers: ["Entered service", "Counted service", "Gratuity before ceiling"], rows: [["7 years 6 months", "7 years", "₹2,01,923.08"], ["7 years 7 months", "8 years", "₹2,30,769.23"]] },
      ],
    },
    {
      id: "gratuity-ceiling",
      title: "Formula amount and statutory ceiling",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `The currently confirmed statutory maximum is ₹${GRATUITY_STATUTORY_CEILING.toLocaleString("en-IN")}. S.O. 1420(E) originally notified that amount under the Payment of Gratuity Act, 1972. Section 164(2)(a) of the Code continues non-conflicting prior notifications under corresponding Code provisions, and the Ministry's December 2025 FAQs expressly confirm ₹20 lakh as the current maximum. The calculator first shows the full formula-derived amount and then caps the estimate if necessary, so the effect is visible rather than hidden.` },
        { type: "callout", variant: "warning", title: "Recheck a future ceiling", text: "The maximum is set by notification and can change. Verify the official position for the date on which gratuity becomes payable rather than treating this number as permanent." },
      ],
    },
    {
      id: "gratuity-ordinary-eligibility",
      title: "Ordinary service rule and qualified exceptions",
      type: "limitations",
      content: [{ type: "paragraph", text: "The ordinary rule in section 53 requires not less than five years of continuous service for the listed termination events. The Code separately qualifies death, disablement, expiration of fixed-term employment, working journalists, and notified events. Official FAQs also explain pro-rata treatment for fixed-term and deceased employees. The calculator therefore warns below five completed years but does not return a definitive eligible or ineligible verdict." }],
    },
    {
      id: "gratuity-benefits",
      title: "What this estimate is useful for",
      type: "benefits",
      content: [{ type: "list", style: "bullet", items: ["Check the standard 15/26 arithmetic using an eligible wage figure.", "See how the service fraction changes at seven additional months.", "Separate the formula amount from the capped estimate.", "Share a validated scenario when discussing payroll assumptions."] }],
    },
    {
      id: "gratuity-exclusions",
      title: "Cases outside this calculator",
      type: "limitations",
      content: [{ type: "paragraph", text: "The numerical model excludes piece-rated and seasonal employment, fixed-term and deceased-employee pro-rata calculations, working-journalist treatment, reduced wages following disablement, government posts governed by other gratuity rules, establishment coverage, continuous-service day tests, awards and better contractual terms, exemptions, nomination and payment procedure, interest for delay, forfeiture, and dispute resolution." }],
    },
    {
      id: "gratuity-employer-result",
      title: "Estimate versus employer determination",
      type: "comparison",
      content: [{ type: "table", caption: "Scope comparison", headers: ["This calculator", "Employer or legal determination"], rows: [["Uses one entered eligible monthly wage", "Determines wage components from payroll, employment terms, and the statutory definition"], ["Uses completed years and remaining months", "Verifies continuous service and the relevant termination event"], ["Applies the standard monthly rated formula and ceiling", "Considers employee category, exceptions, better terms, forfeiture, exemptions, and current law"]] }],
    },
    {
      id: "gratuity-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [{ type: "list", style: "bullet", items: ["Entering gross salary without checking the Code wage definition and 50% rule.", "Treating exactly six additional months as a part-year in excess of six months.", "Using the capped result without noticing a higher formula-derived amount.", "Treating a standard amount estimate as a complete legal eligibility decision."] }],
    },
    {
      id: "gratuity-practical-checks",
      title: "Practical checks before relying on a result",
      type: "practical-tips",
      content: [{ type: "list", style: "bullet", items: ["Confirm the last-drawn eligible wage basis with payroll records.", "Check service dates and any interruptions against the continuous-service rules.", "Identify whether a special employee category or termination event applies.", "Review awards, agreements, contracts, employer policy, and the latest official notification."] }],
    },
    {
      id: "gratuity-disclaimer",
      title: "Educational and legal limitation",
      type: "limitations",
      content: [{ type: "callout", variant: "warning", title: "Estimate, not legal advice", text: "This calculator explains one standard statutory formula. It is not personalised legal, payroll, tax, or financial advice and does not establish entitlement or the amount an employer must finally pay in a particular case." }],
    },
  ],
  relatedLinks: [
    { title: "Gratuity glossary", description: "Read a shorter explanation of gratuity, eligible wages, service, and the calculation relationship.", href: "/glossary/gratuity" },
    { title: "PPF Calculator", description: "Explore a separate long-term savings projection with visible assumptions.", href: "/finance/ppf-calculator" },
  ],
  references: GRATUITY_OFFICIAL_SOURCES.map((source) => ({
    title: `${source.title} — reviewed ${source.checkedOn}`,
    organization: source.issuingAuthority,
    url: source.url,
  })),
} as const satisfies CalculatorKnowledgeContent
