import type { ReactNode } from "react"
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
  return (
    <details className="group rounded-xl border" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
        <span>
          <span className="text-xl font-semibold tracking-tight">{title}</span>
          {description ? <span className="mt-1 block text-sm leading-6 font-normal text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t px-5 pt-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </details>
  )
}
