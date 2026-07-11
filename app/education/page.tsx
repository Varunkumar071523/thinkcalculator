import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Education Calculators",
  description: "Explore education calculators for percentages, grades, scores, and common study needs.",
  alternates: { canonical: "/education" },
}

export default function EducationPage() {
  return <PageIntro title="Education calculators" description="Work through percentages, grades, scores, and common study calculations with less friction." />
}
