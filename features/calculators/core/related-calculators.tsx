import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorSection } from "@/features/calculators/core/calculator-section"
import type { RelatedCalculator } from "@/types/calculator"

export function RelatedCalculators({ calculators }: { readonly calculators: readonly RelatedCalculator[] }) {
  if (calculators.length === 0) return null

  return (
    <CalculatorSection id="related-calculators" title="Related calculators">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calculator) => (
          <Link key={calculator.slug} href={calculator.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader><CardTitle className="flex items-center justify-between gap-3">{calculator.title}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></CardTitle></CardHeader>
              <CardContent><p className="leading-6 text-muted-foreground">{calculator.description}</p><Badge className="mt-4" variant="secondary">{calculator.category}</Badge></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </CalculatorSection>
  )
}
