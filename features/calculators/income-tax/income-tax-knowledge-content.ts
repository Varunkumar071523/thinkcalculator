import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import { INCOME_TAX_FINANCIAL_YEAR, INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"

export const incomeTaxKnowledgeContent = {
  title: "Understand your income tax estimate",
  description: `Use this breakdown alongside the slab-by-slab table to see exactly how your FY ${INCOME_TAX_FINANCIAL_YEAR} tax liability was built up, not just the final number.`,
  sections: [
    {
      id: "income-tax-overview",
      title: "Overview",
      type: "overview",
      content: [
        { type: "paragraph", text: `Income tax in India is charged progressively on taxable income under one of two regimes for FY ${INCOME_TAX_FINANCIAL_YEAR}: the New Regime (the current default, with lower slab rates but fewer deductions) and the Old Regime (higher slab rates but more deductions and exemptions). This calculator estimates your liability under either regime and lets you compare both for the same income.` },
      ],
    },
    {
      id: "income-tax-how-to-use",
      title: "How to use the income tax calculator",
      type: "input-guide",
      content: [
        {
          type: "list",
          style: "numbered",
          items: [
            "Choose the Old Regime or New Regime toggle at the top of the form.",
            "Enter your gross income and select your age band.",
            "Under the old regime, enter 80C, 80D, HRA exemption, home loan interest, and other deductions you can claim. Under the new regime, enter only employer NPS contribution (80CCD(2)), if any.",
            "Select Calculate to see the final tax liability along with the full slab, rebate, surcharge, and cess breakdown.",
          ],
        },
      ],
    },
    {
      id: "income-tax-regime-comparison",
      title: "Old regime versus new regime",
      type: "comparison",
      content: [
        {
          type: "table",
          caption: "Key differences between the old and new tax regimes",
          headers: ["Factor", "Old Regime", "New Regime"],
          rows: [
            ["Standard deduction", `₹${INCOME_TAX_RULE_SET.oldRegime.standardDeduction.toLocaleString("en-IN")}`, `₹${INCOME_TAX_RULE_SET.newRegime.standardDeduction.toLocaleString("en-IN")}`],
            ["Section 87A rebate threshold", `₹${INCOME_TAX_RULE_SET.oldRegime.rebate87A.thresholdTaxableIncome.toLocaleString("en-IN")} taxable income`, `₹${INCOME_TAX_RULE_SET.newRegime.rebate87A.thresholdTaxableIncome.toLocaleString("en-IN")} taxable income`],
            ["Deductions allowed", "80C, 80D, HRA, home loan interest (24b), and other 80-series", "Employer NPS contribution (80CCD(2)) only"],
            ["Top surcharge tier", "37% above ₹5 crore", "Capped at 25% (no 37% tier)"],
          ],
        },
      ],
    },
    {
      id: "income-tax-how-it-works",
      title: "How the calculation works",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: "Taxable income is gross income minus the regime's standard deduction and any other deductions entered. Tax is then applied progressively: each slab's rate applies only to the portion of income that falls within it, not to the whole amount." },
        { type: "paragraph", text: "Section 87A gives a full rebate when taxable income is at or below the regime's threshold. Just above the threshold, marginal relief caps the extra tax at the extra income, so there is no sudden jump at the boundary." },
        { type: "paragraph", text: "Surcharge applies only above ₹50 lakh taxable income, in tiers, with its own marginal relief at each tier so total tax plus surcharge never rises faster than income. Health & Education Cess of 4% is added last, on tax plus surcharge." },
      ],
    },
    {
      id: "income-tax-interpretation",
      title: "Reading the breakdown",
      type: "interpretation",
      content: [
        { type: "paragraph", text: "The slab-by-slab table shows exactly how much income was taxed at each rate. Summing every row's tax gives the tax before rebate. The rebate, surcharge, and cess rows then show each adjustment applied on top, ending in the total tax liability." },
      ],
    },
    {
      id: "income-tax-benefits",
      title: "Benefits of estimating your tax before filing",
      type: "benefits",
      content: [
        { type: "list", style: "bullet", items: [
          "Compare the old and new regime for your actual numbers instead of relying on general advice that may not fit your deduction mix.",
          "See the full slab, rebate, surcharge, and cess breakdown, not just a final figure, so you can spot which line item drives your tax.",
          "Plan deduction decisions, such as an insurance premium or a home loan, before the financial year closes rather than after.",
        ] },
      ],
    },
    {
      id: "income-tax-limitations",
      title: "Limitations and assumptions",
      type: "limitations",
      content: [
        { type: "callout", variant: "important", title: "An estimate, not a filing", text: "This calculator applies regular slab-rate income only. Capital gains under Sections 111A/112/112A and other special-rate income, TDS already deducted, and advance tax instalments are not modelled." },
        { type: "list", style: "bullet", items: [
          "HRA exemption is accepted as an already-calculated amount — the least-of-three-rules calculation itself is not built into this tool.",
          "Employer NPS (80CCD(2)) is accepted as an already-capped amount — the 14%-of-basic-salary cap needs a salary breakdown this tool does not collect.",
          "Section 24(b) always uses the self-occupied-property cap; a let-out property has no statutory cap under this section, which this tool does not distinguish.",
          "Section 80D uses only your own age band, not a separate higher allowance for senior-citizen parents' premiums.",
        ] },
      ],
    },
    {
      id: "income-tax-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [
        { type: "list", style: "bullet", items: [
          "Entering deduction figures under the new regime — only employer NPS (80CCD(2)) is allowed there.",
          "Entering an uncapped HRA or 80CCD(2) figure instead of the already-capped statutory amount.",
          "Comparing regimes using only gross income, without also entering the deductions you would actually claim under the old regime.",
          "Forgetting that surcharge and cess apply on top of slab tax, not as part of the slab rate itself.",
        ] },
      ],
    },
    {
      id: "income-tax-tips",
      title: "Practical tips",
      type: "practical-tips",
      content: [
        { type: "list", style: "bullet", items: [
          "Fill in realistic old-regime deduction figures before relying on the regime comparison — an empty old-regime form will always look worse than it should.",
          "Recheck the comparison whenever your deduction mix changes materially, such as a new home loan or a lapsed insurance policy.",
          "Use the slab breakdown to see your marginal rate, not just your average rate, when planning additional income.",
        ] },
      ],
    },
  ],
  relatedLinks: [
    { title: "PPF Calculator", description: "Explore a common Section 80C investment.", href: "/finance/ppf-calculator" },
    { title: "Gratuity Calculator", description: "Estimate gratuity income, generally exempt under Section 10(10).", href: "/finance/gratuity-calculator" },
    { title: "EMI Calculator", description: "Estimate loan payments relevant to Section 24(b) or 80C.", href: "/finance/emi-calculator" },
  ],
  references: [
    { title: "Salaried Individuals, AY 2026-27 — slab, surcharge, rebate, and cess rates", organization: "Income Tax Department", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" },
    { title: "Senior and Super Senior Citizens, AY 2026-27 — age-band slabs", organization: "Income Tax Department", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-2" },
  ],
} as const satisfies CalculatorKnowledgeContent
