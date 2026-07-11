import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Health Calculators",
  description: "Explore simple health and wellness calculators with clear inputs, results, and responsible guidance.",
  alternates: { canonical: "/health" },
}

export default function HealthPage() {
  return <PageIntro title="Health calculators" description="Understand common health measurements with simple tools, clear context, and responsible informational guidance." />
}
