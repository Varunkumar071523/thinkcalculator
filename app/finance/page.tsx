import type { Metadata } from "next"
import { BarChart3, HandCoins, IndianRupee, Landmark, LineChart, PiggyBank, TrendingUp, WalletCards } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { Badge } from "@/components/ui/badge"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { CalculatorSummary } from "@/types/site"

export const metadata: Metadata = {
  title: "Finance Calculators",
  description: "Explore finance calculators for loans, investments, savings, taxes, and personal money decisions in India.",
  alternates: { canonical: "/finance" },
}

const iconBySlug = {
  "emi-calculator": WalletCards,
  "sip-calculator": LineChart,
  "lumpsum-calculator": PiggyBank,
  "fd-calculator": IndianRupee,
  "rd-calculator": PiggyBank,
  "cagr-calculator": LineChart,
  "ppf-calculator": Landmark,
  "gratuity-calculator": HandCoins,
  "swp-calculator": WalletCards,
  "inflation-calculator": TrendingUp,
} as const

export const financeCalculators: CalculatorSummary[] = calculatorRegistry
  .filter((calculator) => calculator.status === "published" && calculator.category === "Finance")
  .map((calculator) => ({
    title: calculator.title,
    href: calculator.canonicalPath,
    description: calculator.description,
    category: calculator.category,
    icon: iconBySlug[calculator.slug as keyof typeof iconBySlug] ?? BarChart3,
  }))

export default function FinancePage() {
  return (
    <SiteContainer className="py-12 sm:py-20">
      <header className="max-w-3xl">
        <Badge variant="secondary">Finance</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Finance calculators</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Plan loans, investments, savings, and taxes with tools designed around practical financial decisions in India.</p>
      </header>
      <section className="mt-12" aria-labelledby="available-finance-calculators-heading">
        <h2 id="available-finance-calculators-heading" className="text-2xl font-semibold tracking-tight">Available finance calculators</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{financeCalculators.map((calculator) => <CalculatorCard key={calculator.href} calculator={calculator} />)}</div>
      </section>
    </SiteContainer>
  )
}
