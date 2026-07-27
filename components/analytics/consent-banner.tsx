"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { Button } from "@/components/ui/button"
import { applyConsentUpdate, readConsentChoice, writeConsentChoice } from "@/lib/analytics"

type ConsentBannerProps = {
  /** Mirrors lib/analytics-config.ts's getAnalyticsConfig().enabled — there is nothing to ask
   * consent for on a build where GA4 was never injected in the first place (`next dev`, a plain
   * `next build`/`next start`, or the Playwright e2e suite), so this component renders nothing
   * there, matching how components/layout/site-footer.tsx already gates its analytics notice. */
  readonly enabled: boolean
}

/** Never notifies — paired with useSyncExternalStore below purely to get a snapshot value that
 * differs between the server render (always false; localStorage doesn't exist there) and the
 * post-hydration client render, without calling setState inside an effect. Mirrors the identical
 * technique in features/calculators/income-tax/income-tax-calculator.tsx and hra-calculator.tsx. */
function subscribeNever(): () => void {
  return () => {}
}

/**
 * Google Consent Mode v2 banner. Accept/Decline are deliberately the same `Button` component at
 * the same size — no dark pattern where one choice is a full button and the other a soft text
 * link. The choice is stored in localStorage (see lib/analytics.ts) so it is asked once per
 * browser, not once per page.
 *
 * A returning visitor's previously-stored "granted" choice is replayed against Consent Mode by
 * components/analytics/google-analytics.tsx itself — synchronously, in the same inline script
 * that sets the `denied` default — not by this component. An earlier version did that replay
 * here, in a `useEffect` on mount; that left a real gap between "consent defaults to denied" and
 * "the stored granted choice gets reapplied," during which a fast-firing event (e.g.
 * `result_shared` from an immediate user click) could be evaluated by gtag.js while its internal
 * consent state was still `denied` and silently dropped rather than queued. See
 * google-analytics.tsx's own comment and docs/DECISIONS.md's Sprint 45 entry for the full fix.
 * This component's only remaining consent-mode responsibility is the in-session Accept click.
 *
 * Whether to *show* the banner is derived directly from localStorage at render time (guarded by
 * `hydrated`) rather than mirrored into React state from an effect — calling `setState`
 * synchronously inside an effect trips the react-hooks/set-state-in-effect rule and risks a
 * cascading extra render for no benefit here.
 */
export function ConsentBanner({ enabled }: ConsentBannerProps) {
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false)
  const [dismissed, setDismissed] = useState(false)

  if (!enabled || !hydrated || dismissed) return null
  if (readConsentChoice() !== null) return null

  function accept() {
    writeConsentChoice("granted")
    applyConsentUpdate("granted")
    setDismissed(true)
  }

  function decline() {
    writeConsentChoice("denied")
    setDismissed(true)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" role="region" aria-label="Cookie consent">
      <SiteContainer className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          We use Google Analytics to understand visitor traffic. Calculator inputs are never sent to analytics or any third party — see our{" "}
          <Link className="underline hover:text-foreground" href="/privacy-policy">privacy policy</Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={decline}>Decline</Button>
          <Button type="button" onClick={accept}>Accept</Button>
        </div>
      </SiteContainer>
    </div>
  )
}
