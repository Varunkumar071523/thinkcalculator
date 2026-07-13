import type { CalculatorKnowledgeContent } from "@/types/calculator-content"

export const cagrKnowledgeContent = {
  title: "Understand your CAGR result",
  description: "Learn what annualised endpoint growth can explain—and what it leaves out.",
  sections: [
    { id: "cagr-meaning", title: "What CAGR means", type: "how-it-works", content: [{ type: "paragraph", text: "CAGR is the constant annual compound rate that would turn a beginning value into an ending value over the selected period. It summarises two known endpoints; it is not the actual return recorded in every year." }] },
    { id: "cagr-how-to-use", title: "How to use the CAGR calculator", type: "input-guide", content: [{ type: "list", style: "numbered", items: ["Enter the positive value at the beginning of the period.", "Enter the value at the end; use zero only when the ending value was completely lost.", "Enter the elapsed time in years. Fractional years are accepted to two decimal places.", "Calculate and compare CAGR with the total return and absolute gain or loss."] }] },
    { id: "cagr-how-it-works", title: "How the CAGR formula works", type: "how-it-works", content: [{ type: "paragraph", text: "The ending-to-beginning ratio is raised to the inverse of the period, then one is subtracted. This produces the constant annual compound rate that would connect the endpoints." }] },
    { id: "cagr-interpretation", title: "How to interpret CAGR", type: "interpretation", content: [{ type: "paragraph", text: "A positive CAGR means the ending value is higher; a negative CAGR means it is lower. CAGR is useful for comparing differently sized values across periods, but comparisons should use consistent assumptions." }] },
    { id: "cagr-versus-total-return", title: "CAGR versus total return", type: "comparison", content: [{ type: "table", caption: "CAGR and total return compared", headers: ["Measure", "What it shows", "Time treatment"], rows: [["CAGR", "A smooth annualised rate", "Adjusts for the length of the period"], ["Total return", "The complete endpoint percentage change", "Does not annualise the change"]] }] },
    { id: "cagr-example", title: "Worked CAGR example", type: "interpretation", content: [{ type: "paragraph", text: "A beginning value of ₹1,00,000 and ending value of ₹1,61,051 over five years produce an approximately 10% CAGR, ₹61,051 absolute gain, 61.051% total return, and 1.61051× growth multiple." }] },
    { id: "cagr-zero-and-declines", title: "Declines and a zero ending value", type: "interpretation", content: [{ type: "paragraph", text: "An ending value below the beginning value produces a negative CAGR. A zero ending value is treated as a complete loss, so both CAGR and total return are -100%." }] },
    { id: "cagr-benefits", title: "When CAGR is useful", type: "benefits", content: [{ type: "list", style: "bullet", items: ["Summarise multi-year endpoint growth in one annualised figure.", "Compare like-for-like growth rates across periods of different lengths.", "Check the annual rate implied by a known beginning and ending value."] }] },
    { id: "cagr-limitations", title: "Limitations and assumptions", type: "limitations", content: [{ type: "callout", variant: "warning", title: "A smooth rate hides the path", text: "CAGR ignores interim volatility and does not account for money added or withdrawn between the endpoints. For irregular dated cash flows, a cash-flow-aware measure such as XIRR may be more relevant. CAGR is not a forecast and does not guarantee future performance." }] },
    { id: "cagr-common-mistakes", title: "Common CAGR mistakes", type: "common-mistakes", content: [{ type: "list", style: "bullet", items: ["Using zero or a negative beginning value.", "Confusing total return with an annualised return.", "Treating CAGR as the return earned in every individual year.", "Ignoring contributions, withdrawals, fees, taxes, or inflation embedded in the endpoint values.", "Annualising a very short period without explaining how sensitive the result is."] }] },
    { id: "cagr-practical-tips", title: "Practical comparison tips", type: "practical-tips", content: [{ type: "list", style: "bullet", items: ["Use the same valuation basis and currency for both endpoints.", "Compare like-for-like periods and measures.", "Review total return alongside CAGR.", "Use other evidence to assess risk and volatility."] }] },
  ],
  relatedLinks: [
    { title: "Lumpsum Calculator", description: "Project one starting amount under an assumed return.", href: "/finance/lumpsum-calculator" },
    { title: "SIP Calculator", description: "Model regular contributions rather than endpoint-only growth.", href: "/finance/sip-calculator" },
    { title: "FD Calculator", description: "Estimate deposit maturity under a stated rate.", href: "/finance/fd-calculator" },
    { title: "RD Calculator", description: "Estimate the maturity of regular deposits.", href: "/finance/rd-calculator" },
  ],
} as const satisfies CalculatorKnowledgeContent
