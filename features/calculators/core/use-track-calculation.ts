"use client"

import { useEffect } from "react"

import { buildCalculatorEventPayload, trackEvent } from "@/lib/analytics"

/** How long a result must stay unchanged before it counts as "a user got a result," rather than
 * firing once per keystroke on every live-recalculating calculator (see CLAUDE.md's
 * toLiveInput/clampFinite pattern — every calculator recalculates on each field edit). */
const SETTLE_DELAY_MS = 800

/**
 * Fires GA4's `calculation_completed` event once a calculator's result has stayed unchanged for
 * `SETTLE_DELAY_MS` — debounced against live recalculation on every keystroke/slider move, not
 * fired per edit. `result` should be the calculator's own memoized result value (every calculator
 * already computes one via `useMemo(() => calculate...(liveInput), [liveInput])`), so the effect
 * only resets its timer when the underlying inputs actually produced a new result.
 *
 * Deliberately takes only `calculatorType`/`category` identifiers, never `result` itself, into
 * the event payload — `result` is used purely as an effect dependency to detect "the result
 * changed," and is never read into `buildCalculatorEventPayload`. See lib/analytics.ts's
 * `trackEvent` for the consent gating and no-PII payload contract this relies on.
 */
export function useTrackCalculationCompleted(calculatorType: string, category: string, result: unknown): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      trackEvent("calculation_completed", buildCalculatorEventPayload(calculatorType, category))
    }, SETTLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [calculatorType, category, result])
}
