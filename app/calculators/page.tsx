import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Calculators",
  description: "Browse clear, practical calculators for finance, business, health, education, and everyday decisions.",
  alternates: { canonical: "/calculators" },
}

export default function CalculatorsPage() {
  return <PageIntro title="Calculators" description="Find straightforward tools for the numbers behind your money, work, studies, health, and everyday choices." sectionTitle="Calculator library in progress" sectionDescription="We are building each calculator with validated inputs, transparent methods, worked examples, and helpful explanations." />
}
