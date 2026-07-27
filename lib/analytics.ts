// Shared helpers for the GA4 consent banner (components/analytics/consent-banner.tsx) and every
// calculator's event-tracking hook (features/calculators/core/use-track-calculation.ts). Kept
// separate from lib/analytics-config.ts, which only answers "is GA4 built into this bundle at
// all" (the STATIC_EXPORT gate) — this file is about what happens once it is: consent state, the
// page_location leak-prevention mechanism, and the structural no-PII event contract. See
// docs/DECISIONS.md #25 and its Sprint 45 follow-up entry for the full reasoning.

export const CONSENT_STORAGE_KEY = "tc-analytics-consent"
export type ConsentChoice = "granted" | "denied"

/**
 * Pure: strips the query string and hash from a URL, keeping origin + pathname only. This is the
 * exact leak-prevention mechanism documented in components/analytics/google-analytics.tsx's
 * `page_location` override — every calculator's "Copy share link" action encodes entered values
 * into the URL's query string, so the default GA4 `page_view` hit (which sends the full
 * `location.href`) would otherwise leak them. That inline script cannot itself be unit tested (it
 * only exists as a string injected into a real `<script>` tag), so this function exists to make
 * the underlying logic independently, directly testable. Any future change to the inline script
 * must stay equivalent to this.
 */
export function stripPageLocationQuery(href: string): string {
  const url = new URL(href)
  return `${url.origin}${url.pathname}`
}

function isConsentChoice(value: string | null): value is ConsentChoice {
  return value === "granted" || value === "denied"
}

/**
 * Reads the visitor's stored consent choice. `null` means no choice has been made yet (first
 * visit, or storage unavailable/blocked) — callers treat that as "ask." Never throws: a visitor
 * with storage disabled (private browsing, strict browser settings) degrades to "no consent
 * recorded," not a crash.
 */
export function readConsentChoice(): ConsentChoice | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return isConsentChoice(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeConsentChoice(choice: ConsentChoice): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Best-effort — a visitor who blocks storage simply sees the banner again next visit.
  }
}

type GtagFunction = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFunction
    dataLayer?: unknown[]
  }
}

/**
 * Defines `window.gtag`/`window.dataLayer` if they don't already exist, using the same minimal
 * queueing shim Google's own snippet uses (`function gtag(){dataLayer.push(arguments)}`) — calls
 * queue safely even before gtag.js itself has finished loading. Both
 * components/analytics/google-analytics.tsx's inline init script and this module call an
 * equivalent shim, so whichever runs first "wins" and the other is a no-op; there is deliberately
 * no dependency on execution order between the two.
 */
export function ensureGtagShim(): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== "function") {
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
  }
}

/** Applies a Consent Mode v2 update. Safe to call even if gtag.js hasn't loaded yet (see
 * `ensureGtagShim`) and even if analytics is disabled for this build (`window.gtag` is simply
 * never defined in that case, and this call becomes a no-op via `ensureGtagShim`'s own guard). */
export function applyConsentUpdate(choice: ConsentChoice): void {
  if (typeof window === "undefined") return
  ensureGtagShim()
  window.gtag?.("consent", "update", { analytics_storage: choice })
}

/** The only shape a custom event payload is allowed to take in this codebase: calculator
 * identifiers, never a value the user entered or a value that was computed from it. */
export type CalculatorEventPayload = Readonly<{ calculator_type: string; category: string }>

export function buildCalculatorEventPayload(calculatorType: string, category: string): CalculatorEventPayload {
  return { calculator_type: calculatorType, category }
}

/**
 * Fires a GA4 custom event. Gated on consent structurally, in this module, rather than trusting
 * GA4's own Consent Mode handling alone — so a Playwright test (or a future code reviewer) can
 * prove no event is even attempted while consent is declined or not yet chosen, not merely that
 * GA4 chose to withhold it once it arrived. No-ops if analytics was never enabled for this build
 * (`window.gtag` is never defined in that case — see components/analytics/google-analytics.tsx).
 *
 * `params` must never contain a calculator's numeric input or result value — every call site in
 * this codebase only ever passes the `CalculatorEventPayload` shape above, verified by
 * lib/__tests__/analytics.test.ts and tests/e2e/analytics.spec.ts.
 */
export function trackEvent(eventName: string, params: CalculatorEventPayload): void {
  if (typeof window === "undefined") return
  if (readConsentChoice() !== "granted") return
  if (typeof window.gtag !== "function") return
  window.gtag("event", eventName, params)
}
