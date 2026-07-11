import type { Metadata } from "next"
import { TrendingUp, WalletCards } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Finance Calculators",
  description: "Explore finance calculators for loans, investments, savings, taxes, and personal money decisions in India.",
  alternates: { canonical: "/finance" },
}

const emiCalculator = {
  title: "EMI Calculator",
  href: "/finance/emi-calculator",
  description: "Calculate monthly EMI, total interest, and total loan repayment.",
  category: "Finance",
  icon: WalletCards,
}

const sipCalculator = {
  title: "SIP Calculator",
  href: "/finance/sip-calculator",
  description: "Estimate future value, invested amount, and potential SIP returns.",
  category: "Finance",
  icon: TrendingUp,
}

export default function FinancePage() {
  return (
    <SiteContainer className="py-12 sm:py-20">
      <header className="max-w-3xl">
        <Badge variant="secondary">Finance</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Finance calculators</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Plan loans, investments, savings, and taxes with tools designed around practical financial decisions in India.</p>
      </header>
      <section className="mt-12" aria-labelledby="loan-calculators-heading">
        <h2 id="loan-calculators-heading" className="text-2xl font-semibold tracking-tight">Loan calculators</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CalculatorCard calculator={emiCalculator} /><CalculatorCard calculator={sipCalculator} /></div>
      </section>
    </SiteContainer>
  )
}
