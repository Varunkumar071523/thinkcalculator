import type { MetadataRoute } from "next"

import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCanonicalUrl } from "@/lib/seo"

const staticRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/finance", changeFrequency: "monthly", priority: 0.9 },
  { path: "/calculators", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/disclaimer", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const calculators = calculatorRegistry.filter((calculator) => calculator.status === "published").map((calculator) => ({
    url: createCanonicalUrl(calculator.canonicalPath),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes.map((route) => ({ url: createCanonicalUrl(route.path), changeFrequency: route.changeFrequency, priority: route.priority })), ...calculators]
}
