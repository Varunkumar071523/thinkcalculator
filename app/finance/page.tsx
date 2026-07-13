import type { Metadata } from "next"
import { IndianRupee, PiggyBank, TrendingUp, WalletCards } from "lucide-react"

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

const lumpsumCalculator = {
  title: "Lumpsum Calculator",
  href: "/finance/lumpsum-calculator",
  description: "Estimate the future value and potential returns of a one-time investment.",
  category: "Finance",
  icon: PiggyBank,
}

const fdCalculator = {
  title: "FD Calculator",
  href: "/finance/fd-calculator",
  description: "Estimate fixed deposit maturity amount and interest earned.",
  category: "Finance",
  icon: IndianRupee,
}

const rdCalculator = {
  title: "RD Calculator", href: "/finance/rd-calculator",
  description: "Estimate recurring deposit maturity amount and interest earned.", category: "Finance", icon: PiggyBank,
}

const cagrCalculator = {
  title: "CAGR Calculator", href: "/finance/cagr-calculator",
  description: "Calculate annualised compound growth between beginning and ending values.", category: "Finance", icon: TrendingUp,
}

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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CalculatorCard calculator={emiCalculator} /><CalculatorCard calculator={sipCalculator} /><CalculatorCard calculator={lumpsumCalculator} /><CalculatorCard calculator={cagrCalculator} /><CalculatorCard calculator={fdCalculator} /><CalculatorCard calculator={rdCalculator} /></div>
      </section>
    </SiteContainer>
  )
}
