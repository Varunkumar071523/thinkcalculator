import Script from "next/script"

import { CONSENT_STORAGE_KEY } from "@/lib/analytics"

type GoogleAnalyticsProps = {
  measurementId: string
}

// afterInteractive (not beforeInteractive) so this never blocks first paint/interactivity — see
// docs/DECISIONS.md decision 25 for the Sprint 36 record. Only ever rendered when
// lib/analytics-config.ts's getAnalyticsConfig().enabled is true, i.e. a real production static
// export build with a measurement ID configured; never in `next dev` or the Playwright e2e suite.
//
// Sprint 45 adds Google's Consent Mode v2 and two custom events (calculation_completed,
// result_shared — see features/calculators/core/use-track-calculation.ts and
// components/calculators/calculator-actions.tsx). `analytics_storage` defaults to `denied` here,
// on every page load, before gtag.js or the `config` call runs: the script and library still
// load (so a returning visitor's Accept doesn't need a full page reload to start recording), but
// GA4 holds every hit — including the automatic `page_view` this `config` call requests — until
// something calls `gtag('consent','update', ...)` with `analytics_storage: 'granted'`.
//
// A returning visitor's previously-stored "granted" choice (`localStorage[CONSENT_STORAGE_KEY]`)
// is replayed **synchronously, in this same script, immediately after the `default` call** —
// not from a React effect in components/analytics/consent-banner.tsx. This was a deliberate fix
// for a real race: `useTrackCalculationCompleted` debounces 800ms (ample margin against a normal
// effect-scheduling delay), but `CalculatorActions`'s `result_shared` event can fire from a user
// click the instant the page is interactive, and gtag.js evaluates each call's consent state at
// the moment it is processed — a call made while Consent Mode's internal state is still the
// `denied` default (because a React effect replaying "granted" hadn't committed yet) would be
// silently dropped, not queued for later, since no `wait_for_update` window is configured (nor
// would one help here — that window is meant for the first page load's own hits, not for a custom
// event that can fire much later after user interaction). Doing the replay in this synchronous
// script instead closes the gap entirely: there is no point between "consent defaults to denied"
// and "a returning visitor's granted choice is applied" where any other code could run at all,
// since both happen in the same, uninterrupted script execution — no React commit/effect timing
// is involved. `ConsentBanner` now only decides whether to *show* the banner and handles an
// in-session Accept/Decline click (see consent-banner.tsx's own comment). See
// docs/DECISIONS.md's Sprint 45 entry for the full record of this fix.
//
// Every custom event this app fires is additionally, structurally gated on the same consent
// state inside lib/analytics.ts's `trackEvent` itself — not just left to GA4's own Consent Mode
// enforcement — and every payload it sends carries only calculator/category identifiers, never a
// value the visitor entered or a value computed from it (verified by lib/__tests__/analytics.test.ts
// and tests/e2e/analytics.spec.ts).
//
// `page_location` is explicitly overridden to origin+pathname, dropping any query string. This
// matters here specifically: every calculator's "Copy share link" action (see
// components/calculators/calculator-actions.tsx) encodes entered values into a URL's query
// string, so opening someone else's shared link is a real navigation to a URL that contains their
// values — GA4's default `page_location` is the full `location.href`, which would otherwise send
// those values to Google as part of the automatic page_view hit. Stripping the query keeps the
// page_view to "which calculator was viewed" (page path only), which is the one exception the
// no-PII rule allows. The equivalent logic is pulled out as a pure, unit-tested function —
// `stripPageLocationQuery` in lib/analytics.ts — because this inline script cannot itself be unit
// tested; any future change here must stay equivalent to that function.
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
          });
          try {
            if (window.localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { page_location: window.location.origin + window.location.pathname });
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    </>
  )
}
