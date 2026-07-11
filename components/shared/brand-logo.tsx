import Link from "next/link"
import { Calculator } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}
      aria-label="ThinkCalculator home"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Calculator className="size-4" aria-hidden="true" />
      </span>
      <span>ThinkCalculator</span>
    </Link>
  )
}
