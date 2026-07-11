import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the ThinkCalculator privacy policy and learn how the website approaches user privacy.",
  alternates: { canonical: "/privacy-policy" },
}

export default function PrivacyPolicyPage() {
  return <PageIntro title="Privacy policy" description="This page will explain what information ThinkCalculator handles and the choices available to visitors." sectionTitle="Policy being prepared" sectionDescription="ThinkCalculator does not currently offer accounts or store calculator entries in a database. A complete policy will be published as the platform develops." />
}
