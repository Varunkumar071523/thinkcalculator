import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Contact",
  description: "Find contact information and learn how to get in touch with ThinkCalculator.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return <PageIntro title="Contact ThinkCalculator" description="Have feedback about a calculator or an idea for a useful tool? A simple contact channel will be available here soon." sectionTitle="Contact details coming soon" sectionDescription="We are setting up a reliable way to receive questions and feedback. No contact form data is being collected on this page today." />
}
