import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Health Calculators",
  description: "Explore simple health and wellness calculators with clear inputs, results, and responsible guidance.",
  alternates: { canonical: "/health" },
  // No published calculators live under this category yet; keep it linked from navigation but out of
  // the index and sitemap until it has substantive content, matching the Savings topic hub precedent.
  robots: { index: false, follow: true },
}

export default function HealthPage() {
  return <PageIntro title="Health calculators" description="Understand common health measurements with simple tools, clear context, and responsible informational guidance." />
}
