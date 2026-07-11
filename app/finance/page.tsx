import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Finance Calculators",
  description: "Explore finance calculators for loans, investments, savings, taxes, and personal money decisions in India.",
  alternates: { canonical: "/finance" },
}

export default function FinancePage() {
  return <PageIntro title="Finance calculators" description="Plan loans, investments, savings, and taxes with tools designed around practical financial decisions in India." />
}
