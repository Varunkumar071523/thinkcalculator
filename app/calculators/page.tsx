import type { Metadata } from "next"
import { IndianRupee, PiggyBank, TrendingUp, WalletCards } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Calculators",
  description: "Browse clear, practical calculators for finance, business, health, education, and everyday decisions.",
  alternates: { canonical: "/calculators" },
}

const availableCalculators = [{
  title: "EMI Calculator",
  href: "/finance/emi-calculator",
  description: "Calculate monthly EMI, total interest payable, and total loan repayment.",
  category: "Finance",
  icon: WalletCards,
}, {
  title: "SIP Calculator",
  href: "/finance/sip-calculator",
  description: "Estimate future value, total invested amount, and potential SIP returns.",
  category: "Finance",
  icon: TrendingUp,
}, {
  title: "Lumpsum Calculator",
  href: "/finance/lumpsum-calculator",
  description: "Estimate the future value and potential returns of a one-time investment.",
  category: "Finance",
  icon: PiggyBank,
}, {
  title: "FD Calculator",
  href: "/finance/fd-calculator",
  description: "Estimate fixed deposit maturity amount and interest earned.",
  category: "Finance",
  icon: IndianRupee,
}]

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
