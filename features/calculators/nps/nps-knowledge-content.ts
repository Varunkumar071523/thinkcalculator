import type { CalculatorKnowledgeContent } from "@/types/calculator-content"

export const npsKnowledgeContent = {
  title: "Understand your NPS projection",
  description: "Use the asset allocation, blended return, and growth chart together when comparing how allocation choices change your projected corpus.",
  sections: [
    { id: "nps-how-to-use", title: "How to use the NPS calculator", type: "input-guide", content: [{ type: "list", style: "numbered", items: ["Enter your planned monthly contribution.", "Set your current age and expected retirement age.", "Set your equity and corporate debt allocation percentages — government securities fills the remainder automatically.", "Set an expected annual return for each asset class, then review the blended rate, projected corpus, and growth chart."] }] },
    { id: "nps-allocation", title: "How asset allocation drives the projection", type: "how-it-works", content: [{ type: "paragraph", text: "This calculator blends your three asset-class expected returns by their allocation share into one rate, and compounds your monthly contribution at that blended rate. Raising your equity allocation (with a higher assumed equity return) raises the blended rate — and, in real markets, the year-to-year variability of the outcome, which this constant-rate illustration cannot show." }] },
    { id: "nps-market-linked", title: "NPS is market-linked, not fixed-rate", type: "how-it-works", content: [{ type: "callout", variant: "important", title: "Not a guaranteed return", text: "Unlike EPF or PPF, NPS returns depend on the actual performance of the underlying equity, corporate debt, and government securities investments. The expected-return inputs here are editable modelling assumptions, not a promised or historical rate." }] },
    { id: "nps-schedule", title: "How to interpret the growth chart", type: "interpretation", content: [{ type: "paragraph", text: "The growth line separates cumulative contributions from the estimated total value, so you can see how much of the projected corpus comes from your own contributions versus compounding growth at the blended rate." }] },
    { id: "nps-benefits", title: "Benefits of projecting your NPS corpus", type: "benefits", content: [{ type: "list", style: "bullet", items: ["See how shifting the allocation between equity, corporate debt, and government securities changes the projected corpus.", "Compare a longer contribution period against a higher monthly contribution.", "Use alongside the EPF and Retirement Corpus calculators for a fuller retirement-savings picture."] }] },
    { id: "nps-limitations", title: "Limitations and assumptions", type: "limitations", content: [{ type: "callout", variant: "important", title: "An educational projection, not an NPS statement", text: "This calculator excludes Tier I/Tier II account distinctions, employer contributions under the corporate model, the mandatory annuitization portion at exit, partial-withdrawal rules, fund manager and scheme charges, and tax treatment. It uses one constant blended rate for the full projection period, not year-to-year market variation." }] },
    { id: "nps-mistakes", title: "Common NPS projection mistakes", type: "common-mistakes", content: [{ type: "list", style: "bullet", items: ["Treating the illustrative expected-return defaults as a promised or historical NPS return.", "Forgetting that a portion of the actual NPS corpus must be used to purchase an annuity at exit, which this calculator does not model.", "Assuming a fixed monthly contribution over decades instead of revisiting it as income changes."] }] },
    { id: "nps-tips", title: "Practical planning tips", type: "practical-tips", content: [{ type: "list", style: "bullet", items: ["Re-run the projection with a more conservative equity return to see a lower-growth scenario alongside the default.", "Compare this projection with the EPF calculator to see how a fixed-rate and a market-linked retirement vehicle differ.", "Verify your actual NPS holdings and returns through your Permanent Retirement Account Number (PRAN) statement."] }] },
    {
      id: "nps-vs-epf-vs-ppf",
      title: "NPS compared with EPF and PPF",
      type: "comparison",
      content: [
        {
          type: "table",
          caption: "Educational comparison of NPS, EPF, and PPF — general characteristics, not tax or investment advice; verify current rules before relying on any row",
          headers: ["Factor", "NPS", "EPF", "PPF"],
          rows: [
            ["Eligibility", "Any eligible individual, including the self-employed", "Salaried employees under the scheme", "Any resident individual"],
            ["Employer contribution", "Optional — common in the corporate NPS model, on top of the employee's own contribution", "Mandatory, matches the employee's statutory rate", "None — self-funded only, no employer channel"],
            ["Return type", "Market-linked, varies with the chosen equity/corporate debt/govt securities allocation — not a declared rate", "EPFO-declared annual rate, reviewed yearly", "Government-notified annual rate, reviewed quarterly"],
            ["Liquidity before retirement", "Locked until the scheme's exit age (typically 60); limited partial withdrawals for specific purposes, capped in number and amount", "Generally locked until retirement or 2 months after leaving employment, with conditional partial withdrawals for specific purposes (medical, housing, education, marriage)", "15-year lock-in; partial withdrawal permitted from year 7, and loans against the balance in years 3-6"],
            ["Exit treatment", "Only part of the corpus (commonly up to 60%) is paid as a lump sum; the remainder must generally be used to buy an annuity, and the annuity income is then taxed as regular income when received", "Full balance generally payable on eligible exit", "Full balance payable at maturity"],
            ["Typical tax treatment", "Contribution stage generally gets a tax deduction and the tax-free lump-sum portion at exit is exempt, but — unlike EPF and PPF — the annuity income NPS eventually pays out is taxed as regular income, so NPS is not a full EEE product end to end", "Contributions, interest, and maturity are generally tax-exempt (EEE) when withdrawal conditions — including the continuous-service requirement — are met; early withdrawal can be taxable", "Contributions, interest, and maturity are all generally tax-exempt (EEE), which is why PPF is often used as the simplest EEE benchmark"],
          ],
        },
      ],
    },
  ],
  relatedLinks: [
    { title: "EPF Calculator", description: "Estimate your Employees' Provident Fund corpus at retirement.", href: "/finance/epf-calculator" },
    { title: "SIP Calculator", description: "Project the future value of regular mutual fund investments.", href: "/finance/sip-calculator" },
    { title: "Retirement Corpus Calculator", description: "Project a full accumulation-to-withdrawal retirement plan.", href: "/finance/retirement-corpus-calculator" },
    { title: "PPF Calculator", description: "Estimate Public Provident Fund maturity value.", href: "/finance/ppf-calculator" },
  ],
} as const satisfies CalculatorKnowledgeContent
