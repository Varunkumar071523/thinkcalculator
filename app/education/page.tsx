import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Education Calculators",
  description: "Explore education calculators for percentages, grades, scores, and common study needs.",
  alternates: { canonical: "/education" },
  // No published calculators live under this category yet; keep it linked from navigation but out of
  // the index and sitemap until it has substantive content, matching the Savings topic hub precedent.
  robots: { index: false, follow: true },
}

export default function EducationPage() {
  return <PageIntro title="Education calculators" description="Work through percentages, grades, scores, and common study calculations with less friction." />
}
