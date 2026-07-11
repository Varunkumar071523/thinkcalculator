import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Read the informational-use disclaimer for ThinkCalculator calculators and educational content.",
  alternates: { canonical: "/disclaimer" },
}

export default function DisclaimerPage() {
  return <PageIntro title="Disclaimer" description="ThinkCalculator provides calculators and content for general informational and educational purposes." sectionTitle="Use results as a helpful estimate" sectionDescription="Calculator results may depend on assumptions and the information entered. Verify important results independently and consult a qualified professional for financial, tax, legal, medical, or other specialist advice." />
}
