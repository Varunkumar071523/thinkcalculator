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
          <p>ThinkCalculator does not currently collect, store, or process personal data on its own servers — there is no backend or database. This site does use Google Analytics (GA4), described below; see India&apos;s Digital Personal Data Protection Act (DPDPA), 2023 for the broader data-protection context, which this site takes a disclosure-first approach to ahead of that Act&apos;s remaining provisions coming into force.</p>
          <p>Google Analytics (GA4) is used to understand overall site traffic. It automatically collects your IP address, device and browser information, and the pages you view. ThinkCalculator never sends calculator input values (loan amounts, income figures, rent, or any other value you enter) to Google Analytics, in a page path, event, or any other field. Google Analytics sets its own cookies to do this; see <a className="underline hover:text-foreground" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">Google&apos;s page on how it uses data from sites that use its services</a> for what Google does with this data.</p>
          <p>The &quot;Copy share link&quot; action on calculators encodes the values you entered into the link in plain, readable form. Anyone who opens a shared link can see those values.</p>
        </>
      }
    />
  )
}
