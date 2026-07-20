import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalculatorSummary } from "@/types/site"

export function CalculatorCard({ calculator }: { calculator: CalculatorSummary }) {
  const Icon = calculator.icon
  return (
    <Link href={calculator.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:bg-muted/40">
        <CardHeader className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted"><Icon className="size-5" aria-hidden="true" /></span>
          <CardTitle>{calculator.title}</CardTitle>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <p className="leading-6 text-muted-foreground">{calculator.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{calculator.category}</Badge>
            {calculator.badge === "popular" ? <Badge className="bg-gold-soft text-gold">Popular</Badge> : null}
            {calculator.badge === "new" ? <Badge className="bg-money-soft text-money">New</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
