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
 * (schedules, formulas, tips) that shouldn't force a visitor to scroll past it. */
export function CollapsibleSection({ title, description, children, defaultOpen = false }: CollapsibleSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  // The `@media print` CSS override alone is not enough to reveal a closed <details> on every
  // engine: Chromium renders its collapsed content through the ::details-content pseudo-element
  // and skips it via content-visibility, which no CSS applied to the light-DOM children can reach
  // (confirmed directly — a forced `display:block` on the child still left a real, non-zero
  // bounding box that Element.checkVisibility() reported as false and a print screenshot showed
  // genuinely blank; only overriding content-visibility on ::details-content itself fixed it), and
  // that pseudo-element isn't supported at all in every engine. Toggling the actual `open` property
  // in response to the print media query sidesteps every engine-specific rendering path at once.
  useEffect(() => {
    const details = detailsRef.current
    if (!details) return
    const mediaQuery = window.matchMedia("print")
    let wasOpenBeforePrint = details.open
    function handleChange(event: MediaQueryListEvent) {
      if (!details) return
      if (event.matches) {
        wasOpenBeforePrint = details.open
        details.open = true
      } else {
        details.open = wasOpenBeforePrint
      }
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
      <div className="border-t px-5 pt-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </details>
  )
}
