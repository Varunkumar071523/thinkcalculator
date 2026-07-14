import type { Metadata } from "next"
import { BarChart3, HandCoins, IndianRupee, Landmark, LineChart, PiggyBank, ReceiptIndianRupee, WalletCards } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { Badge } from "@/components/ui/badge"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { CalculatorSummary } from "@/types/site"

export const metadata: Metadata = {
  title: "Calculators",
  description: "Browse clear, practical calculators for finance, business, health, education, and everyday decisions.",
  alternates: { canonical: "/calculators" },
}

const iconBySlug = {
  "emi-calculator": WalletCards,
  "sip-calculator": LineChart,
  "lumpsum-calculator": PiggyBank,
  "fd-calculator": IndianRupee,
  "rd-calculator": PiggyBank,
  "cagr-calculator": LineChart,
  "ppf-calculator": Landmark,
  "gst-calculator": ReceiptIndianRupee,
  "gratuity-calculator": HandCoins,
  "swp-calculator": WalletCards,
} as const

export const availableCalculators: CalculatorSummary[] = calculatorRegistry
  .filter((calculator) => calculator.status === "published")
  .map((calculator) => ({
    title: calculator.title,
    href: calculator.canonicalPath,
    description: calculator.description,
    category: calculator.category,
    icon: iconBySlug[calculator.slug as keyof typeof iconBySlug] ?? BarChart3,
  }))

export default function CalculatorsPage() {
  return (
    <SiteContainer className="py-12 sm:py-20">
      <header className="max-w-3xl">
        <Badge variant="secondary">Calculator library</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Calculators</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Find straightforward tools for the numbers behind your money, work, studies, health, and everyday choices.</p>
      </header>
      <section className="mt-12" aria-labelledby="available-calculators-heading">
        <h2 id="available-calculators-heading" className="text-2xl font-semibold tracking-tight">Available calculators</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{availableCalculators.map((item) => <CalculatorCard key={item.href} calculator={item} />)}</div>
      </section>
    </SiteContainer>
  )
}
