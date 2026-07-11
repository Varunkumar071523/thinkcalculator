import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Business Calculators",
  description: "Explore business calculators for GST, pricing, margins, and everyday commercial decisions.",
  alternates: { canonical: "/business" },
}

export default function BusinessPage() {
  return <PageIntro title="Business calculators" description="Make GST, pricing, margin, and other everyday business calculations easier to understand and use." />
}
