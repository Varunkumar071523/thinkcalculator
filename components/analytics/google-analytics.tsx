import Script from "next/script"

type GoogleAnalyticsProps = {
  measurementId: string
}

// afterInteractive (not beforeInteractive) so this never blocks first paint/interactivity — see
// docs/DECISIONS.md for the Sprint 36 record. Only ever rendered when
// lib/analytics-config.ts's getAnalyticsConfig().enabled is true, i.e. a real production static
// export build with a measurement ID configured; never in `next dev` or the Playwright e2e suite.
//
// No custom events are dispatched anywhere in the app — this sends only GA4's own default
// `page_view` hit. Calculator inputs are never read here or passed to gtag by any other code path.
//
// `page_location` is explicitly overridden to origin+pathname, dropping any query string. This
// matters here specifically: every calculator's "Copy share link" action (see
// components/calculators/calculator-actions.tsx) encodes entered values into a URL's query
// string, so opening someone else's shared link is a real navigation to a URL that contains their
// values — GA4's default `page_location` is the full `location.href`, which would otherwise send
// those values to Google as part of the automatic page_view hit. Stripping the query keeps the
// page_view to "which calculator was viewed" (page path only), which is the one exception the
// no-PII rule allows.
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { page_location: window.location.origin + window.location.pathname });
        `}
      </Script>
    </>
  )
}
