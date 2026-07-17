import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import { HRA_FINANCIAL_YEAR, HRA_RULE_SET } from "./hra-regulatory-config"

export const hraKnowledgeContent = {
  title: "Understand your HRA exemption",
  description: "See exactly how the three Section 10(13A) limits were calculated and which one determined your exemption.",
  sections: [
    {
      id: "hra-overview",
      title: "Overview",
      type: "overview",
      content: [
        { type: "paragraph", text: `House Rent Allowance (HRA) is a common salary component. Under Section 10(13A) of the Income-tax Act, read with Rule 2A, a portion of HRA received can be exempt from tax — but only for a salaried employee under the old tax regime who actually pays rent for accommodation they live in. This calculator computes that exemption for FY ${HRA_FINANCIAL_YEAR} (AY ${HRA_RULE_SET.assessmentYear}).` },
      ],
    },
    {
      id: "hra-how-to-use",
      title: "How to use the HRA calculator",
      type: "input-guide",
      content: [
        {
          type: "list",
          style: "numbered",
          items: [
            "Enter your annual basic salary.",
            "Enter DA only if it forms part of retirement benefits; otherwise leave it at 0.",
            "Enter the total HRA you received and the total rent you paid for the year.",
            "Select whether you live in a metro or non-metro city.",
            "Select Calculate to see all three limits, which one is binding, and your exempt and taxable HRA.",
          ],
        },
      ],
    },
    {
      id: "hra-how-it-works",
      title: "How the calculation works",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: "The calculator computes three separate amounts: the actual HRA you received, rent paid minus 10% of salary (floored at zero), and 50% of salary for a metro city or 40% for a non-metro city. Whichever of the three is smallest becomes your exempt HRA — this is the statutory 'least of the three' rule, not an average or a sum." },
        { type: "paragraph", text: "Taxable HRA is simply HRA received minus the exempt amount, and is added to your other taxable salary income." },
      ],
    },
    {
      id: "hra-interpretation",
      title: "Reading the result",
      type: "interpretation",
      content: [
        { type: "paragraph", text: "The result card shows all three limits individually, not just the smallest. The binding-limit explanation below it names which one applied and why, so you can see what would need to change (rent, salary, or HRA itself) to increase your exemption." },
      ],
    },
    {
      id: "hra-limitations",
      title: "Limitations and assumptions",
      type: "limitations",
      content: [
        { type: "callout", variant: "important", title: "Old regime only", text: "HRA exemption under Section 10(13A) is not available under the new tax regime. Passing this result into the income tax calculator only affects an old-regime calculation." },
        {
          type: "list",
          style: "bullet",
          items: [
            `Uses the FY ${HRA_FINANCIAL_YEAR} metro city list (${HRA_RULE_SET.metroCities.join(", ")}). A later financial year's list can differ — see lib/hra/rules/README.md in the codebase for the current known change.`,
            "Commission that is a fixed percentage of turnover is part of the statutory salary definition but is not collected as a separate input here.",
            "Whole-year figures only — no support for a mid-year city change, rent change, or salary revision.",
          ],
        },
      ],
    },
    {
      id: "hra-common-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [
        {
          type: "list",
          style: "bullet",
          items: [
            "Entering gross salary instead of basic salary (plus qualifying DA) — the calculation uses only basic salary and qualifying DA, not your full CTC.",
            "Assuming the exemption applies under the new tax regime — it does not.",
            "Forgetting that the rent-based limit is floored at zero, not negative, when rent paid is low relative to salary.",
          ],
        },
      ],
    },
    {
      id: "hra-regime-comparison",
      title: "Old regime versus new regime",
      type: "comparison",
      content: [
        {
          type: "table",
          caption: "HRA exemption availability by regime",
          headers: ["Factor", "Old Regime", "New Regime"],
          rows: [
            ["Section 10(13A) HRA exemption", "Available, subject to the least-of-three-limits rule", "Not available — full HRA received is taxable"],
            ["Where to use this result", "Old-regime HRA exemption deduction field", "Not applicable"],
          ],
        },
      ],
    },
    {
      id: "hra-benefits",
      title: "Benefits of calculating HRA exemption separately",
      type: "benefits",
      content: [
        {
          type: "list",
          style: "bullet",
          items: [
            "See exactly which of the three statutory limits is holding your exemption back, instead of guessing a single figure.",
            "Feed a verified, correctly-derived exemption straight into the income tax calculator's old-regime HRA field instead of estimating it by hand.",
            "Understand how a rent increase or a salary revision would change your exemption before it happens, not after filing.",
          ],
        },
      ],
    },
    {
      id: "hra-tips",
      title: "Practical tips",
      type: "practical-tips",
      content: [
        {
          type: "list",
          style: "bullet",
          items: [
            "Recalculate whenever your rent, basic salary, or city of residence changes during the year, since this calculator only handles a single whole-year figure.",
            "If the percentage-of-salary limit is binding, a change in rent alone will not increase your exemption — only a change in salary or city classification will.",
            "Keep rent receipts and, where required, a rent agreement or landlord PAN on hand — this calculator estimates the exemption but does not replace the documentation your employer or assessing officer may require.",
          ],
        },
      ],
    },
  ],
  relatedLinks: [
    { title: "Income Tax Calculator", description: "Use your computed exemption as an old-regime deduction.", href: "/finance/income-tax-calculator" },
    { title: "Gratuity Calculator", description: "Estimate another salary-linked, generally exempt benefit.", href: "/finance/gratuity-calculator" },
  ],
  references: [
    { title: "House Rent Allowance (HRA) — exemption, calculation, and rules", organization: "ClearTax", url: "https://cleartax.in/s/hra-house-rent-allowance" },
    { title: "HRA in the New Tax Regime", organization: "Bajaj Finserv", url: "https://www.bajajfinserv.in/hra-in-new-tax-regime" },
  ],
} as const satisfies CalculatorKnowledgeContent
