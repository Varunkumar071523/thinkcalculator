import type { LucideIcon } from "lucide-react"

export type SiteLink = {
  title: string
  href: string
}

export type SiteCategory = SiteLink & {
  description: string
  icon: LucideIcon
}

export type CalculatorSummary = SiteLink & {
  description: string
  category: string
  icon: LucideIcon
}

export type FooterGroup = {
  title: string
  links: SiteLink[]
}
