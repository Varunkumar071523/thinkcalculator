import type { EditorialAuthor, EditorialCategory, EditorialTag } from "@/types/editorial-content"

export const editorialAuthor: EditorialAuthor = { id: "thinkcalculator-editorial-team", name: "ThinkCalculator Editorial Team", description: "Educational content prepared for ThinkCalculator." }
export const editorialCategories = {
  loans: { slug: "loans", name: "Loans", description: "Educational explanations of borrowing and repayment calculations." },
  investing: { slug: "investing", name: "Investing", description: "Educational explanations of investment calculations and assumptions." },
  savings: { slug: "savings", name: "Savings", description: "Educational explanations of deposit and savings calculations." },
} as const satisfies Record<string, EditorialCategory>
export const editorialTags = {
  emi: { slug: "emi", name: "EMI" }, loans: { slug: "loans", name: "Loans" }, sip: { slug: "sip", name: "SIP" },
  mutualFunds: { slug: "mutual-funds", name: "Mutual Funds" }, compounding: { slug: "compounding", name: "Compounding" },
  financialPlanning: { slug: "financial-planning", name: "Financial Planning" }, investments: { slug: "investments", name: "Investments" },
  cagr: { slug: "cagr", name: "CAGR" }, swp: { slug: "swp", name: "SWP" }, foir: { slug: "foir", name: "FOIR" },
} as const satisfies Record<string, EditorialTag>
