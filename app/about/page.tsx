import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "About",
  description: "Learn about ThinkCalculator and our approach to clear, practical decision-making tools.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return <PageIntro title="About ThinkCalculator" description="ThinkCalculator is an India-focused platform for clear calculators and educational content that help people make informed everyday decisions." sectionTitle="Calculate. Compare. Decide." sectionDescription="Our goal is to make useful calculations understandable by showing clear inputs, transparent methods, and practical context." />
}
