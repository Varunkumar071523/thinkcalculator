import type { LucideIcon } from "lucide-react"

import type { CalculatorGroup } from "@/lib/calculator-taxonomy"

export type SiteLink = {
  title: string
  href: string
}

export type SiteCategory = SiteLink & {
  description: string
  icon: LucideIcon
  availability?: string
}

export type CalculatorSummary = SiteLink & {
  description: string
  category: string
  icon: LucideIcon
}

/**
 * Deliberately does NOT carry an `icon: LucideIcon` field like `CalculatorSummary` does. This
 * data flows into client components (see components/shared/calculator-grid.tsx) as props from a
 * Server Component page, and a component function reference cannot be serialized across that
 * boundary — the icon is resolved client-side instead, from `slug` via `calculatorIconBySlug`.
 */
export type GroupedCalculatorSummary = {
  title: string
  href: string
  description: string
  category: string
  slug: string
  group: CalculatorGroup
  popular?: boolean
}

export type FooterGroup = {
  title: string
  links: SiteLink[]
}
