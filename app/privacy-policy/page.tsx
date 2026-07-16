import type { Metadata } from "next"

import { PageIntro } from "@/components/shared/page-intro"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the ThinkCalculator privacy policy and learn how the website approaches user privacy.",
  alternates: { canonical: "/privacy-policy" },
}

export default function PrivacyPolicyPage() {
  return (
    <PageIntro
      title="Privacy policy"
      description="This page will explain what information ThinkCalculator handles and the choices available to visitors."
      sectionTitle="Policy being prepared"
      sectionDescription={
        <>
          <p>ThinkCalculator does not currently offer accounts or store calculator entries in a database. A complete policy will be published as the platform develops.</p>
          <p>ThinkCalculator does not currently collect, store, or process personal data. As a result, it is not currently subject to data-fiduciary obligations under India&apos;s Digital Personal Data Protection Act (DPDPA), 2023. This will be revisited if that changes.</p>
          <p>The &quot;Copy share link&quot; action on calculators encodes the values you entered into the link in plain, readable form. Anyone who opens a shared link can see those values.</p>
        </>
      }
    />
  )
}
