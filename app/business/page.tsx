import type { Metadata } from "next"
import { BarChart3, ReceiptIndianRupee } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { Badge } from "@/components/ui/badge"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { CalculatorSummary } from "@/types/site"

export const metadata: Metadata = {
  title: "Business Calculators",
  description: "Explore business calculators for GST, pricing, margins, and everyday commercial decisions.",
  alternates: { canonical: "/business" },
}

const iconBySlug = { "gst-calculator": ReceiptIndianRupee } as const
export const businessCalculators: CalculatorSummary[] = calculatorRegistry
  .filter((calculator) => calculator.status === "published" && calculator.category === "Business")
  .map((calculator) => ({ title: calculator.title, href: calculator.canonicalPath, description: calculator.description, category: calculator.category, icon: iconBySlug[calculator.slug as keyof typeof iconBySlug] ?? BarChart3, badge: calculator.badge }))

export default function BusinessPage() { return <SiteContainer className="py-12 sm:py-20"><header className="max-w-3xl"><Badge variant="secondary">Business</Badge><h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Business calculators</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Work through GST and everyday commercial arithmetic with clear methods, visible assumptions, and practical limitations.</p></header><section className="mt-12" aria-labelledby="available-business-calculators-heading"><h2 id="available-business-calculators-heading" className="text-2xl font-semibold tracking-tight">Available business calculators</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{businessCalculators.map((calculator) => <CalculatorCard key={calculator.href} calculator={calculator} />)}</div></section></SiteContainer> }
