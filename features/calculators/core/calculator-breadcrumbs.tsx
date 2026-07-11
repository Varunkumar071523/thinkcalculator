import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { CalculatorCategory } from "@/types/calculator"

const categoryPaths: Record<CalculatorCategory, string> = {
  Finance: "/finance",
  Business: "/business",
  Health: "/health",
  Education: "/education",
  Utility: "/calculators",
}

type CalculatorBreadcrumbsProps = {
  readonly category: CalculatorCategory
  readonly calculatorTitle: string
}

export function CalculatorBreadcrumbs({
  category,
  calculatorTitle,
}: CalculatorBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li><Link className="hover:text-foreground" href="/">Home</Link></li>
        <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
        <li><Link className="hover:text-foreground" href={categoryPaths[category]}>{category}</Link></li>
        <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
        <li className="text-foreground" aria-current="page">{calculatorTitle}</li>
      </ol>
    </nav>
  )
}
