import { EPF_RATE_CONFIG } from "./epf-rate-config"
import type { CalculatorKnowledgeContent } from "@/types/calculator-content"

export const epfKnowledgeContent = {
  title: "Understand your EPF projection",
  description: "Use the estimate alongside the yearly breakdown when comparing how salary, contribution rates, and time to retirement change your projected corpus.",
  sections: [
    { id: "epf-how-to-use", title: "How to use the EPF calculator", type: "input-guide", content: [{ type: "list", style: "numbered", items: ["Enter your monthly basic salary plus dearness allowance.", "Set the employee and employer contribution rates as a percentage of that salary.", "Set your current age and expected retirement age.", `Review the projected corpus, the yearly employee/employer/interest breakdown, and adjust the assumed interest rate (default reflects the ${EPF_RATE_CONFIG.financialYear} EPFO rate).`] }] },
    { id: "epf-contribution-structure", title: "How EPF contributions work", type: "how-it-works", content: [{ type: "paragraph", text: "Under the standard scheme, the employee contributes 12% of basic wages plus dearness allowance, and the employer contributes a matching amount. In practice, part of the employer's share is usually diverted to the Employees' Pension Scheme (EPS) up to a wage ceiling, with the remainder credited to the EPF account." }, { type: "callout", variant: "important", title: "This calculator does not model EPS", text: "The entire employer rate you enter is treated as flowing into the EPF corpus. A real EPF-only balance is typically lower once the EPS carve-out is accounted for." }] },
    { id: "epf-interest", title: "How interest is calculated here", type: "how-it-works", content: [{ type: "paragraph", text: "Interest compounds monthly on the running balance after that month's employee and employer contributions are added, using one constant assumed annual rate that you can edit. Official EPF accounting also computes interest monthly, but credits it once a year on rules tied to the lowest running balance, so small differences from an official passbook figure are expected." }] },
    { id: "epf-schedule", title: "How to interpret the yearly breakdown", type: "interpretation", content: [{ type: "paragraph", text: "Each bar in the yearly chart splits that year's corpus growth into employee contribution, employer contribution, and interest earned. Interest becomes a larger share of yearly growth over time as compounding accumulates on a growing balance." }] },
    { id: "epf-benefits", title: "Benefits of projecting your EPF corpus", type: "benefits", content: [{ type: "list", style: "bullet", items: ["Compare how contribution rate changes or a longer working period affect the projected corpus.", "See how much of the corpus comes from contributions versus compounding interest.", "Prepare informed questions before making a voluntary provident fund (VPF) decision."] }] },
    { id: "epf-limitations", title: "Limitations and assumptions", type: "limitations", content: [{ type: "callout", variant: "important", title: "An educational projection, not an EPFO passbook", text: "This calculator excludes the EPS carve-out, the EPF wage ceiling, salary revisions, job changes, withdrawals, missed contributions, and the exact monthly interest-eligibility rules EPFO applies. It uses one constant assumed interest rate for the full projection period." }] },
    { id: "epf-mistakes", title: "Common EPF projection mistakes", type: "common-mistakes", content: [{ type: "list", style: "bullet", items: ["Entering gross salary instead of basic salary plus dearness allowance.", "Assuming the employer's full contribution rate reaches the EPF account rather than being partly diverted to EPS.", "Treating a single constant assumed rate as a guarantee across a multi-decade projection.", "Ignoring that salary, and therefore contribution amounts, typically rises over a career instead of staying flat."] }] },
    { id: "epf-tips", title: "Practical planning tips", type: "practical-tips", content: [{ type: "list", style: "bullet", items: ["Re-run the projection after a salary revision to keep the estimate current.", "Compare this projection alongside the PPF and NPS calculators for a fuller retirement-savings picture.", "Verify your actual EPF balance and interest credited through the official EPFO member passbook."] }] },
    {
      id: "epf-vs-ppf-vs-nps",
      title: "EPF compared with PPF and NPS",
      type: "comparison",
      content: [
        {
          type: "table",
          caption: "Educational comparison of EPF, PPF, and NPS — general characteristics, not tax or investment advice; verify current rules before relying on any row",
          headers: ["Factor", "EPF", "PPF", "NPS"],
          rows: [
            ["Eligibility", "Salaried employees under the scheme", "Any resident individual", "Any eligible individual, including the self-employed"],
            ["Employer contribution", "Mandatory, matches the employee's statutory rate", "None — self-funded only, no employer channel", "Optional — common in the corporate NPS model, on top of the employee's own contribution"],
            ["Return type", "EPFO-declared annual rate, reviewed yearly", "Government-notified annual rate, reviewed quarterly", "Market-linked, varies with the chosen equity/corporate debt/govt securities allocation — not a declared rate"],
            ["Liquidity before retirement", "Generally locked until retirement or 2 months after leaving employment, with conditional partial withdrawals for specific purposes (medical, housing, education, marriage)", "15-year lock-in; partial withdrawal permitted from year 7, and loans against the balance in years 3-6", "Locked until the scheme's exit age (typically 60); limited partial withdrawals for specific purposes, capped in number and amount"],
            ["Exit treatment", "Full balance generally payable on eligible exit", "Full balance payable at maturity", "Only part of the corpus (commonly up to 60%) is paid as a lump sum; the remainder must generally be used to buy an annuity, and the annuity income is then taxed as regular income when received"],
            ["Typical tax treatment", "Contributions, interest, and maturity are generally tax-exempt (EEE) when withdrawal conditions — including the continuous-service requirement — are met; early withdrawal can be taxable", "Contributions, interest, and maturity are all generally tax-exempt (EEE), which is why PPF is often used as the simplest EEE benchmark", "Contribution stage generally gets a tax deduction and the tax-free lump-sum portion at exit is exempt, but — unlike EPF and PPF — the annuity income NPS eventually pays out is taxed as regular income, so NPS is not a full EEE product end to end"],
          ],
        },
      ],
    },
  ],
  relatedLinks: [
    { title: "PPF Calculator", description: "Estimate Public Provident Fund maturity value.", href: "/finance/ppf-calculator" },
    { title: "NPS Calculator", description: "Project a market-linked National Pension System corpus.", href: "/finance/nps-calculator" },
    { title: "Gratuity Calculator", description: "Estimate a standard statutory gratuity amount.", href: "/finance/gratuity-calculator" },
    { title: "Retirement Corpus Calculator", description: "Project a full accumulation-to-withdrawal retirement plan.", href: "/finance/retirement-corpus-calculator" },
  ],
} as const satisfies CalculatorKnowledgeContent
