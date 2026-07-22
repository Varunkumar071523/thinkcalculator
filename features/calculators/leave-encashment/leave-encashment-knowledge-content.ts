import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import {
  LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR,
  LEAVE_ENCASHMENT_OFFICIAL_SOURCES,
  LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE,
  LEAVE_ENCASHMENT_STATUTORY_LIMIT,
} from "./leave-encashment-regulatory-config"

export const leaveEncashmentKnowledgeContent = {
  title: "Understand the leave encashment tax exemption",
  description: "Learn how section 10(10AA) exempts leave encashment received at retirement or resignation, the current ₹25 lakh non-government limit, the government-employee full exemption, and the questions this calculator does not decide.",
  sections: [
    {
      id: "leave-encashment-meaning",
      title: "What leave encashment means",
      type: "overview",
      content: [{ type: "paragraph", text: "Leave encashment is the cash payment an employer makes for unused earned leave. It can happen while an employee is still in service, or as part of a final settlement at retirement or resignation. Only the retirement-or-resignation case is eligible for a section 10(10AA) exemption; encashment received during service is fully taxable as salary, whatever the employee type." }],
    },
    {
      id: "leave-encashment-current-framework",
      title: "Current statutory context",
      type: "overview",
      content: [
        { type: "paragraph", text: `The Central Board of Direct Taxes raised the section 10(10AA)(ii) exemption limit for non-government employees from ₹3,00,000 to ₹${LEAVE_ENCASHMENT_STATUTORY_LIMIT.toLocaleString("en-IN")} with effect from 1 April 2023, in line with the Budget 2023 announcement. Sources were reviewed on ${LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE} and confirm the limit unchanged since.` },
        { type: "callout", variant: "important", title: "An aggregate, lifetime limit", text: "The ₹25 lakh ceiling is not reset per employer or per year: it is a lifetime aggregate across every non-government employer from which an employee has ever received exempt leave encashment." },
      ],
    },
    {
      id: "leave-encashment-inputs",
      title: "What to enter",
      type: "input-guide",
      content: [{ type: "list", style: "numbered", items: [
        "Choose Government (Central/State) or Non-government — this decides whether the calculator applies full exemption or the least-of-four formula.",
        "Enter last-drawn and 10-month-average basic + DA salary — not gross salary or CTC.",
        "Enter the total leave encashment amount actually received and the number of leave days it represents.",
        "Enter completed years of service and your employer's annual leave-earning rate, so the calculator can apply the 30-day-per-year statutory cap.",
        "Optionally choose an illustrative marginal tax rate to see an estimated tax on the taxable portion.",
      ] }],
    },
    {
      id: "leave-encashment-method",
      title: "How the exemption is calculated",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: "For a Government employee, the full amount received is exempt and no further calculation is applied. For every other employee, the calculator finds four amounts and treats the smallest as the exempt amount." },
        { type: "list", style: "numbered", items: [
          "Actual amount received.",
          "10-month average salary × 10.",
          `Cash equivalent of leave at credit: the leave days encashed, capped at ${LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR} days for every completed year of service, valued at the last-drawn salary ÷ 30 daily rate.`,
          `The current ₹${LEAVE_ENCASHMENT_STATUTORY_LIMIT.toLocaleString("en-IN")} statutory limit.`,
        ] },
        { type: "paragraph", text: "The taxable amount is the amount received minus the exempt amount. An illustrative marginal tax rate is then applied only to the taxable amount, to show an estimated net figure — this rate plays no part in the exemption calculation itself." },
      ],
    },
    {
      id: "leave-encashment-30-day-cap",
      title: "The 30-days-per-year leave-credit cap",
      type: "interpretation",
      content: [
        { type: "paragraph", text: "Explanation 2 to section 10(10AA)(ii) recognises at most 30 days of leave for every completed year of service, regardless of how many days an employer's policy actually lets an employee earn or carry forward each year. An employee who earns 45 days a year still has only 30 days per year counted toward this component; an employee who earns 20 days a year has only those 20 days per year counted." },
        { type: "table", caption: "Effect of the annual leave-earning rate on the leave-at-credit component (10 years of service, ₹1,000 daily rate)", headers: ["Leave days earned per year", "Days counted per year", "Leave-at-credit component"], rows: [["20", "20", "₹2,00,000"], ["30", "30", "₹3,00,000"], ["45", "30", "₹3,00,000"]] },
      ],
    },
    {
      id: "leave-encashment-employee-type",
      title: "Government versus non-government treatment",
      type: "interpretation",
      content: [
        { type: "paragraph", text: "Central and State Government employees receive full exemption on retirement under section 10(10AA)(i), with no monetary ceiling at all. Employees of local authorities, statutory corporations, PSUs, private companies, and every other non-government employer use the least-of-four formula and the ₹25 lakh limit under section 10(10AA)(ii)." },
        { type: "callout", variant: "warning", title: "PSU employees are usually non-government for this purpose", text: "A common misunderstanding is treating a public-sector undertaking as a \"government\" employer. For section 10(10AA), only Central and State Government employees get the uncapped exemption; PSU and other public-sector employees generally follow the non-government rule." },
      ],
    },
    {
      id: "leave-encashment-benefits",
      title: "What this estimate is useful for",
      type: "benefits",
      content: [{ type: "list", style: "bullet", items: ["See which of the four components actually limits your exemption before you retire or resign.", "Check how a higher or lower annual leave-earning rate changes the leave-at-credit component.", "Compare a government and non-government scenario side by side.", "Get a quick, illustrative estimate of tax on the taxable portion, at a rate you choose."] }],
    },
    {
      id: "leave-encashment-comparison",
      title: "Leave encashment compared with gratuity and retirement corpus",
      type: "comparison",
      content: [{ type: "table", caption: "Educational comparison of leave encashment, gratuity, and retirement corpus benefits — general characteristics, not tax advice; verify current rules and your own facts before relying on any row.", headers: ["Aspect", "Leave encashment", "Gratuity", "Retirement corpus (EPF/NPS)"], rows: [
        ["Applicable provision", "Section 10(10AA), Income-tax Act, 1961", "Payment of Gratuity Act, 1972 / Code on Social Security, 2020", "Section 10(11)/10(12) (EPF) or section 10(12A) (NPS) — separate provisions per scheme"],
        ["Exemption basis", "Least of four amounts for non-government employees: amount received, 10-month average salary × 10, leave-at-credit capped at 30 days per year of service, and the statutory limit", "15/26 × last-drawn eligible wages × counted service years, capped at a statutory ceiling", "Depends on the scheme and withdrawal type — EPF is generally exempt if continuous-service conditions are met; NPS exempts only the lump-sum portion, with the annuity taxed as regular income when received"],
        ["Government vs non-government", "Full exemption with no ceiling for Central/State Government employees; a ₹25 lakh aggregate lifetime cap for every other employee", "The same 15/26 formula and statutory ceiling generally apply to both, so this scheme does not draw as sharp a government/non-government line", "EPF's continuous-service exemption condition and NPS's annuity taxation apply regardless of employer type — the government/non-government distinction that matters for leave encashment and gratuity does not carry over here"],
        ["What triggers payment", "Encashing unused leave at retirement or resignation — encashment received while still in service is fully taxable for every employee type", "Retirement, resignation, death, or disablement after qualifying continuous service", "Retirement, maturity, an eligible exit, or a scheme-permitted partial withdrawal"],
        ["Statutory cap (current figure)", "₹25,00,000 lifetime aggregate for non-government employees; no cap for government employees", "₹20,00,000 statutory ceiling, same figure for both employee types", "No single monetary exemption cap — EPF and NPS instead work through contribution ceilings, continuous-service conditions, and withdrawal-type rules"],
        ["How the payout itself is computed", "Leave days encashed × a salary-derived daily rate, subject to the 30-days-per-year cap — a leave-based formula", "15 days' wages × counted service years — a service-based formula, not tied to leave days at all", "Accumulated contributions plus declared or market-linked returns (EPF), or the invested corpus value at exit (NPS) — an accumulation-based figure, not a formula applied to a single final salary"],
      ] }],
    },
    {
      id: "leave-encashment-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [{ type: "list", style: "bullet", items: ["Entering gross salary or CTC instead of basic + DA for the salary fields.", "Treating a PSU or autonomous-body employer as \"Government\" for this exemption.", "Assuming leave encashed while still employed qualifies for any section 10(10AA) exemption.", "Forgetting that the ₹25 lakh limit is a lifetime aggregate, not a fresh limit per employer or per year.", "Using an employer's annual leave-earning rate above 30 days directly, without letting the calculator apply the 30-day-per-year cap."] }],
    },
    {
      id: "leave-encashment-practical-checks",
      title: "Practical checks before relying on a result",
      type: "practical-tips",
      content: [{ type: "list", style: "bullet", items: ["Confirm your basic + DA figures with payroll rather than estimating from gross pay.", "Ask HR for your actual encashable leave balance and any leave already encashed against the lifetime limit at a previous employer.", "Verify whether your employer classifies you as a government or non-government employee for this specific exemption.", "Recheck the current statutory limit against an official source close to your retirement or resignation date, since it can change."] }],
    },
    {
      id: "leave-encashment-limitations",
      title: "Cases outside this calculator",
      type: "limitations",
      content: [{ type: "paragraph", text: "This calculator does not determine your retirement or resignation date, verify your actual leave balance or accumulation policy, account for leave encashment already claimed as exempt against the lifetime ₹25 lakh limit at a previous employer, distinguish local-authority or PSU employment from Central/State Government employment, or compute your overall income tax liability. The marginal tax rate is a user-chosen illustrative figure, not a computed slab result." }],
    },
    {
      id: "leave-encashment-disclaimer",
      title: "Educational and tax limitation",
      type: "limitations",
      content: [{ type: "callout", variant: "warning", title: "Estimate, not tax advice", text: "This calculator explains one statutory exemption formula using figures you enter. It is not personalised tax, payroll, or legal advice, and does not establish your actual eligibility, leave balance, or final tax liability. Verify the current statutory limit and your specific facts with a qualified professional or official source before relying on this figure." }],
    },
  ],
  relatedLinks: [
    { title: "Gratuity Calculator", description: "Estimate the separate statutory gratuity benefit, capped at its own statutory ceiling.", href: "/finance/gratuity-calculator" },
    { title: "Income Tax Calculator", description: "Estimate full income tax liability under the old and new regimes for a more precise post-tax figure.", href: "/finance/income-tax-calculator" },
  ],
  references: LEAVE_ENCASHMENT_OFFICIAL_SOURCES.map((source) => ({
    title: `${source.title} — reviewed ${source.checkedOn}`,
    organization: source.issuingAuthority,
    url: source.url,
  })),
} as const satisfies CalculatorKnowledgeContent
