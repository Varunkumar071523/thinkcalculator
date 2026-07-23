import {
  BadgeIndianRupee,
  CalendarCheck,
  HandCoins,
  IndianRupee,
  Landmark,
  LineChart,
  type LucideIcon,
  PiggyBank,
  ReceiptIndianRupee,
  Sunrise,
  TrendingUp,
  WalletCards,
} from "lucide-react"

import type { CalculatorDefinition } from "@/types/calculator"
import type { GroupedCalculatorSummary } from "@/types/site"

/**
 * Finer-grained grouping used for the homepage/finance filterable grid and its
 * category-color styling. Distinct from `CalculatorCategory` (Finance/Business/...),
 * which is the coarser taxonomy already used for routing and breadcrumbs.
 */
export type CalculatorGroup = "loans" | "investments" | "savings" | "taxes" | "business"

export const calculatorGroups: readonly { readonly id: CalculatorGroup; readonly label: string }[] = [
  { id: "loans", label: "Loans" },
  { id: "investments", label: "Investments" },
  { id: "savings", label: "Savings" },
  { id: "taxes", label: "Taxes" },
  { id: "business", label: "Business" },
]

export const calculatorGroupBySlug: Readonly<Record<string, CalculatorGroup>> = {
  "emi-calculator": "loans",
  "home-loan-eligibility-calculator": "loans",
  "sip-calculator": "investments",
  "lumpsum-calculator": "investments",
  "fd-calculator": "savings",
  "rd-calculator": "savings",
  "cagr-calculator": "investments",
  "ppf-calculator": "savings",
  "gst-calculator": "business",
  "gratuity-calculator": "taxes",
  "hra-calculator": "taxes",
  "income-tax-calculator": "taxes",
  "step-up-sip-calculator": "investments",
  "swp-calculator": "investments",
  "inflation-calculator": "investments",
  "retirement-corpus-calculator": "investments",
  "epf-calculator": "savings",
  "nps-calculator": "investments",
  "leave-encashment-calculator": "taxes",
  "eps-pension-calculator": "savings",
}

export const calculatorIconBySlug: Readonly<Record<string, LucideIcon>> = {
  "emi-calculator": WalletCards,
  "home-loan-eligibility-calculator": Landmark,
  "sip-calculator": LineChart,
  "lumpsum-calculator": PiggyBank,
  "fd-calculator": IndianRupee,
  "rd-calculator": BadgeIndianRupee,
  "cagr-calculator": LineChart,
  "ppf-calculator": Landmark,
  "gst-calculator": ReceiptIndianRupee,
  "gratuity-calculator": HandCoins,
  "hra-calculator": Landmark,
  "income-tax-calculator": ReceiptIndianRupee,
  "step-up-sip-calculator": TrendingUp,
  "swp-calculator": WalletCards,
  "inflation-calculator": TrendingUp,
  "retirement-corpus-calculator": Sunrise,
  "epf-calculator": PiggyBank,
  "nps-calculator": Landmark,
  "leave-encashment-calculator": CalendarCheck,
  "eps-pension-calculator": PiggyBank,
}

export type CalculatorGroupStyle = {
  readonly border: string
  readonly iconBg: string
  readonly iconColor: string
  readonly text: string
  readonly dot: string
}

export const calculatorGroupStyles: Readonly<Record<CalculatorGroup, CalculatorGroupStyle>> = {
  loans: { border: "border-l-cat-loans", iconBg: "bg-cat-loans-soft", iconColor: "text-cat-loans", text: "text-cat-loans", dot: "bg-cat-loans" },
  investments: { border: "border-l-cat-invest", iconBg: "bg-cat-invest-soft", iconColor: "text-cat-invest", text: "text-cat-invest", dot: "bg-cat-invest" },
  savings: { border: "border-l-cat-savings", iconBg: "bg-cat-savings-soft", iconColor: "text-cat-savings", text: "text-cat-savings", dot: "bg-cat-savings" },
  taxes: { border: "border-l-cat-tax", iconBg: "bg-cat-tax-soft", iconColor: "text-cat-tax", text: "text-cat-tax", dot: "bg-cat-tax" },
  business: { border: "border-l-cat-business", iconBg: "bg-cat-business-soft", iconColor: "text-cat-business", text: "text-cat-business", dot: "bg-cat-business" },
}

export function toGroupedCalculators(definitions: readonly CalculatorDefinition[]): GroupedCalculatorSummary[] {
  return definitions
    .filter((definition) => definition.status === "published")
    .map((definition) => ({
      title: definition.title,
      href: definition.canonicalPath,
      description: definition.description,
      category: definition.category,
      slug: definition.slug,
      group: calculatorGroupBySlug[definition.slug] ?? "business",
      badge: definition.badge,
    }))
}

export function countByGroup(calculators: readonly GroupedCalculatorSummary[]): Readonly<Record<CalculatorGroup, number>> {
  const counts: Record<CalculatorGroup, number> = { loans: 0, investments: 0, savings: 0, taxes: 0, business: 0 }
  for (const calculator of calculators) counts[calculator.group] += 1
  return counts
}
