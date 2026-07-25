"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

type CollapsibleSectionProps = {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly defaultOpen?: boolean
}

/** A collapsed-by-default accordion section, following the same `<details>` + rotating-chevron
 * pattern already used by FAQSection — reusable for any below-the-fold calculator content
 * (schedules, formulas, tips) that shouldn't force a visitor to scroll past it.
 *
 * Print reveal for closed sections is primarily handled by the `@media print` rules in
 * `app/globals.css` (the `details:not([open])` / `::details-content` overrides), which are
 * deterministic — verified across repeated isolated `page.emulateMedia({ media: "print" })` runs —
 * on Chromium and Firefox. WebKit does not honor that CSS at all: Sprint 44's cross-browser
 * follow-up found the exact same content stays hidden under print media emulation on WebKit
 * regardless of the `::details-content` override or the plain light-DOM `display` override, 5/5
 * calculators failing deterministically across 2 isolated reruns each (not flaky — plainly
 * unsupported). The `matchMedia("print")` listener below is kept specifically as the WebKit
 * fallback: it actually sets `details.open = true`, a real state change every engine honors,
 * sidestepping whatever WebKit does internally to hide closed `<details>` content that no print
 * stylesheet can reach. It is intentionally not the primary mechanism (see docs/DECISIONS.md
 * #35/#36): the `change` event fires asynchronously and isn't guaranteed to run before the browser
 * paints the print layout, which is exactly the race that made Chromium/EMI/Inflation flaky before
 * the CSS fix landed. On Chromium/Firefox this listener is redundant with the CSS and harmless if
 * it never fires in time; on WebKit it is the only mechanism available at all. */
export function CollapsibleSection({ title, description, children, defaultOpen = false }: CollapsibleSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const details = detailsRef.current
    if (!details) return
    const mediaQuery = window.matchMedia("print")
    let wasOpenBeforePrint = details.open
    function applyPrintState(isPrint: boolean) {
      if (!details) return
      if (isPrint) {
        wasOpenBeforePrint = details.open
        details.open = true
      } else {
        details.open = wasOpenBeforePrint
      }
    }
    // A `change` listener alone misses a print media flip that already happened before this
    // effect runs (e.g. Playwright's `page.emulateMedia({ media: "print" })` firing while this
    // "use client" component is still hydrating) — `addEventListener` only reports *future*
    // changes, and a MediaQueryList gives no way to ask "did I miss one?". Checking `.matches`
    // synchronously here catches that case regardless of which side of hydration the flip landed
    // on; this is the fix for the hydration-timing race Sprint 44's WebKit follow-up found (see
    // docs/DECISIONS.md #36) — 5/5 calculators failed deterministically under the old
    // listener-only version because the emulated print media typically flipped before this
    // component had finished hydrating on the test machine.
    applyPrintState(mediaQuery.matches)
    function handleChange(event: MediaQueryListEvent) {
      applyPrintState(event.matches)
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <details ref={detailsRef} className="group rounded-xl border" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
        <span>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? <span className="mt-1 block text-sm leading-6 font-normal text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t px-5 pt-5 pb-5 sm:px-6 sm:pb-6" data-collapsible-content>{children}</div>
    </details>
  )
}
