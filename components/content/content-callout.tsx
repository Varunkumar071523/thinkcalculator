import { CircleAlert, CircleHelp, Lightbulb, TriangleAlert } from "lucide-react"
import type { CalculatorContentCallout as Callout } from "@/types/calculator-content"

const icons = { note: CircleHelp, tip: Lightbulb, warning: TriangleAlert, important: CircleAlert }

export function ContentCallout({ callout }: { callout: Callout }) {
  const Icon = icons[callout.variant]
  return <aside className="rounded-xl border bg-muted/40 p-4" aria-label={`${callout.title} ${callout.variant}`}><div className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">{callout.title}</p><p className="mt-1 leading-7 text-muted-foreground">{callout.text}</p></div></div></aside>
}
