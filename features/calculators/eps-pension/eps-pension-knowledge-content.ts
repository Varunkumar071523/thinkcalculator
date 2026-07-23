import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import {
  EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS,
  EPS_PENSION_BONUS_SERVICE_YEARS,
  EPS_PENSION_DIVISOR,
  EPS_PENSION_EARLY_PENSION_MIN_AGE,
  EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR,
  EPS_PENSION_MINIMUM_MONTHLY_PENSION,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_OFFICIAL_SOURCES,
  EPS_PENSION_REGULATORY_REVIEW_DATE,
  EPS_PENSION_STANDARD_RETIREMENT_AGE,
  EPS_PENSION_WAGE_CEILING,
} from "./eps-pension-regulatory-config"

export const epsPensionKnowledgeContent = {
  title: "Understand the EPS 2026 monthly pension",
  description: "Learn how EPS 2026 turns pensionable salary and pensionable service into a monthly pension, the current wage ceiling and minimum pension, and how EPS differs from EPF and NPS.",
  sections: [
    {
      id: "eps-pension-meaning",
      title: "What the EPS monthly pension is",
      type: "overview",
      content: [{ type: "paragraph", text: "The Employees' Pension Scheme, 2026 (EPS 2026) pays a defined monthly pension for life to eligible members of the Employees' Provident Fund Organisation (EPFO), computed by a fixed formula rather than paid out of a personal savings balance. It is funded from a portion of the employer's Provident Fund contribution, not by a separate employee contribution, and it is entirely distinct from the employee's own EPF account." }],
    },
    {
      id: "eps-pension-current-framework",
      title: "Current statutory context",
      type: "overview",
      content: [
        { type: "paragraph", text: "The Employees' Pension Scheme, 2026 (EPS 2026) was gazetted 29 June 2026 under the Code on Social Security, 2020, superseding the Employees' Pension Scheme, 1995 (EPS 1995) and the Employees' Family Pension Scheme, 1971. The monthly-pension formula and every statutory figure this calculator uses carry over unchanged from EPS 1995 into EPS 2026, so an existing member sees continuity in their numbers, not a surprise change." },
        { type: "paragraph", text: `The pensionable-salary wage ceiling used in the formula is currently ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}/month and the minimum monthly pension is ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")}, both set under the Employees' Pension (Amendment) Scheme, 2014, effective 1 September 2014, and retained unchanged by EPS 2026. Sources were reviewed on ${EPS_PENSION_REGULATORY_REVIEW_DATE} and confirm both figures unchanged since.` },
        { type: "callout", variant: "important", title: "Not the post-2022 \"higher pension\" option", text: "This calculator applies only the standard, wage-ceiling-capped EPS 2026 formula. It does not compute the higher-pension option (based on actual, uncapped salary) that became available to specific eligible members after the Supreme Court's November 2022 ruling, which depends on individual employer-contribution history and a separate EPFO application." },
      ],
    },
    {
      id: "eps-pension-inputs",
      title: "What to enter",
      type: "input-guide",
      content: [{ type: "list", style: "numbered", items: [
        "Enter your average monthly basic pay plus dearness allowance over the last 60 months before exit — not gross salary or CTC.",
        `Enter your total years of pensionable service. The calculator applies the ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus and the ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}-year eligibility check automatically.`,
        `Choose the standard age (${EPS_PENSION_STANDARD_RETIREMENT_AGE}) option, or the early-pension option to see a separate, reduced figure for starting between ${EPS_PENSION_EARLY_PENSION_MIN_AGE} and 57.`,
      ] }],
    },
    {
      id: "eps-pension-method",
      title: "How the pension is calculated",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: `The calculator first caps your entered salary at the ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} wage ceiling to get pensionable salary, then adds a ${EPS_PENSION_BONUS_SERVICE_YEARS}-year bonus to your entered service if it is ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years or more, to get pensionable service.` },
        { type: "list", style: "numbered", items: [
          `Formula pension = pensionable salary × pensionable service ÷ ${EPS_PENSION_DIVISOR}.`,
          `Standard-age pension = the greater of the formula pension and the ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum, for a member with at least ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service.`,
          `If early pension is chosen, that standard-age figure is reduced by ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR}% for every year the start age falls short of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}.`,
        ] },
        { type: "paragraph", text: `A member with fewer than ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service is not eligible for a monthly pension at all — the calculator returns ₹0 and flags ineligibility rather than showing a formula result nobody would actually receive.` },
      ],
    },
    {
      id: "eps-pension-ceiling-and-bonus",
      title: "The wage ceiling and the 20-year bonus",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `Even a member whose actual basic + DA is well above ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} has their pensionable salary capped at that figure, because EPS contributions themselves are only calculated on wages up to the ceiling. Separately, completing ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years or more of pensionable service adds a flat ${EPS_PENSION_BONUS_SERVICE_YEARS} years to the service figure used in the formula, regardless of how much beyond ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years was actually served.` },
        { type: "table", caption: `Effect of the wage ceiling on pensionable salary (formula uses the lower of actual salary and ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")})`, headers: ["Actual average monthly basic + DA", "Pensionable salary used"], rows: [["₹12,000", "₹12,000"], ["₹15,000", "₹15,000"], ["₹24,000", `₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}`], ["₹60,000", `₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}`]] },
      ],
    },
    {
      id: "eps-pension-eligibility-and-floor",
      title: "Eligibility and the minimum pension",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `Two separate rules protect a low formula result: the ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}-year eligibility floor decides whether any monthly pension is payable at all, and the ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum-pension floor decides the smallest amount an eligible member can receive at the standard age, however small the formula figure is.` },
        { type: "callout", variant: "warning", title: "Ineligibility is not zero pension by formula", text: `A member with, say, 8 years of pensionable service is not simply given a small formula pension — they are not eligible for any monthly EPS pension at all until they reach ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years.` },
      ],
    },
    {
      id: "eps-pension-early-pension",
      title: "Taking an early pension",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `A member can start drawing a pension as early as age ${EPS_PENSION_EARLY_PENSION_MIN_AGE}, in exchange for a ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR}%-per-year reduction for every year short of the standard age of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}. This reduction is permanent for the life of the pension, not a temporary discount that later corrects itself.` },
        { type: "table", caption: "Reduction applied to the standard-age pension by early-pension start age", headers: ["Start age", "Years short of 58", "Reduction", "Pension as % of standard-age pension"], rows: [["50", "8", "32%", "68%"], ["53", "5", "20%", "80%"], ["55", "3", "12%", "88%"], ["57", "1", "4%", "96%"]] },
      ],
    },
    {
      id: "eps-pension-benefits",
      title: "What this estimate is useful for",
      type: "benefits",
      content: [{ type: "list", style: "bullet", items: ["See how much of your entered salary the pension formula actually uses once the wage ceiling caps it.", "Check whether your service already qualifies for the 20-year bonus, or how many more years would get you there.", "Compare a standard-age pension against an early-pension scenario before deciding when to exit.", "Confirm whether the minimum-pension floor, rather than the formula, would determine your payout."] }],
    },
    {
      id: "eps-pension-comparison",
      title: "EPS compared with EPF and NPS",
      type: "comparison",
      content: [
        { type: "paragraph", text: `EPS is not an addition to your EPF contribution — it is carved out of the employer's existing EPF contribution (currently 8.33% of wages up to ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}, plus a 1.16% Central Government top-up on the same capped wages), so having an EPS pension does not reduce your own 12% employee EPF contribution or balance. NPS has no structural link to either scheme — a member can hold EPF/EPS and NPS accounts at the same time.` },
        { type: "table", caption: "Educational comparison of EPS, EPF, and NPS — general characteristics, not financial advice; verify current rules and your own facts before relying on any row.", headers: ["Aspect", "EPS", "EPF", "NPS"], rows: [
          ["What it is", "Defined-benefit: a fixed monthly pension for life", "Defined-contribution: a balance plus declared interest", "Defined-contribution: a market-linked, invested corpus"],
          ["Funded by", "Part of the employer's EPF contribution + 1.16% govt.", "12% employee + remaining employer contribution", "Employee's own contribution, often employer-matched"],
          ["What you receive", "Fixed monthly amount once eligible, not a lump sum", "Full balance plus interest, generally as a lump sum", "Capped lump sum plus a compulsory annuity pension"],
          ["Risk borne by", "EPFO — payout does not depend on markets", "EPFO — a declared rate, not market-linked", "The member — corpus depends on fund performance"],
        ] },
      ],
    },
    {
      id: "eps-pension-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [{ type: "list", style: "bullet", items: ["Entering gross salary or CTC instead of basic + DA for the salary field.", "Assuming the formula uses your actual salary once it is above the wage ceiling, rather than the capped figure.", "Treating a member with fewer than 10 years of service as entitled to a small formula pension instead of no monthly pension at all.", "Confusing this EPS pension estimate with an EPF balance or NPS corpus projection — they use entirely different mechanics.", "Assuming this calculator includes the post-2022 Supreme Court higher-pension option, which it deliberately does not."] }],
    },
    {
      id: "eps-pension-practical-checks",
      title: "Practical checks before relying on a result",
      type: "practical-tips",
      content: [{ type: "list", style: "bullet", items: ["Confirm your actual pensionable service and last-60-months salary history from your EPFO passbook or Form 3A/6, rather than estimating from memory.", "Check your UAN-linked EPFO records for any earlier withdrawal or scheme-certificate history that could affect continuity of pensionable service.", "If your salary is well above the wage ceiling and you believe you may be eligible for the higher-pension option, consult EPFO directly rather than relying on this calculator.", "Recheck the current wage ceiling and minimum pension against an official EPFO source close to your exit date, since these figures can change."] }],
    },
    {
      id: "eps-pension-limitations",
      title: "Cases outside this calculator",
      type: "limitations",
      content: [{ type: "paragraph", text: "This calculator does not verify your actual EPFO service record, salary history, or exit date; does not compute the post-2022 Supreme Court higher-pension option; does not compute the separate withdrawal benefit payable below 10 years of pensionable service; and does not model family pension, or disability/widow pension variants of EPS. It also has not independently verified whether EPS 2026's own gazette text renumbers the paragraph 12/12(7) provisions cited in this calculator's sources — see the disclaimer below." }],
    },
    {
      id: "eps-pension-disclaimer",
      title: "Educational and scope limitation",
      type: "limitations",
      content: [{ type: "callout", variant: "warning", title: "Estimate, not pension or financial advice", text: "This calculator explains the standard EPS 2026 formula using figures you enter. It is not personalised pension, retirement, or financial advice, and does not establish your actual eligibility, service record, or final pension amount. Verify current statutory figures and your specific facts with EPFO or a qualified professional before relying on this estimate." }],
    },
  ],
  relatedLinks: [
    { title: "EPF Calculator", description: "Project your separate Employees' Provident Fund balance and maturity value.", href: "/finance/epf-calculator" },
    { title: "NPS Calculator", description: "Estimate the National Pension System corpus and annuity from your own contributions.", href: "/finance/nps-calculator" },
  ],
  references: EPS_PENSION_OFFICIAL_SOURCES.map((source) => ({
    title: `${source.title} — reviewed ${source.checkedOn}`,
    organization: source.issuingAuthority,
    url: source.url,
  })),
} as const satisfies CalculatorKnowledgeContent
