type DonutItem = {
  readonly label: string
  readonly value: number
  readonly formattedValue: string
  readonly colorClass: string
  /** Tailwind stroke class for this segment's ring color (e.g. "stroke-money"). Defaults to the
   * grayscale chart-1/chart-2/chart-3 tokens so existing callers keep their current look. */
  readonly ringClass?: string
}

export type DonutSegment = { readonly percent: number; readonly dashOffset: number }

/** Pure segment geometry for an SVG donut built from stacked partial-circle strokes: each item's
 * `percent` is its share of the circle's circumference-as-100-units (matches this file's `r`, whose
 * circumference is ~100), and `dashOffset` is the negative cumulative offset (in the same units)
 * that starts its arc where the previous item's arc ended, walking clockwise from the top of a
 * `-rotate-90`-transformed circle. Extracted as its own function — rather than inlined per-segment
 * JSX math — so 2-item and 3-item layouts share one implementation and so the zero-total and
 * single-segment (100%-to-one-item) edge cases are directly unit-testable without rendering SVG.
 * When every item is 0 (zero-total), the entire ring is attributed to the first item, matching the
 * pre-extraction 2-item component's existing zero-value behavior. */
export function computeDonutSegments(items: readonly DonutItem[]): readonly DonutSegment[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0
  return items.map((item, index) => {
    const percent = total > 0 ? (item.value / total) * 100 : index === 0 ? 100 : 0
    const segment: DonutSegment = { percent, dashOffset: cumulative === 0 ? 0 : -cumulative }
    cumulative += percent
    return segment
  })
}

const DEFAULT_RING_CLASSES = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3"] as const

// Widened from a fixed 2-tuple to a 2-or-3-tuple so a calculator whose breakdown has three parts
// (e.g. NPS's equity/corporate debt/govt securities allocation) can reuse this chart instead of
// forking it. Every existing 2-item caller (EMI, PPF, retirement corpus, ...) keeps type-checking
// unchanged, since a 2-tuple is still one of the two accepted shapes.
export function SimpleDonutChart({ title, items }: { readonly title: string; readonly items: readonly [DonutItem, DonutItem] | readonly [DonutItem, DonutItem, DonutItem] }) {
  const segments = computeDonutSegments(items)
  const description = items.map((item) => `${item.label}: ${item.formattedValue}.`).join(" ")

  return (
    <section aria-labelledby="donut-title">
      <h2 id="donut-title" className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <svg className="size-40 shrink-0 -rotate-90" viewBox="0 0 42 42" role="img" aria-label={description}>
          {items.map((item, index) => (
            <circle
              key={item.label}
              className={`fill-none ${item.ringClass ?? DEFAULT_RING_CLASSES[index]}`}
              cx="21"
              cy="21"
              r="15.9155"
              strokeWidth="8"
              strokeDasharray={`${segments[index].percent} ${100 - segments[index].percent}`}
              strokeDashoffset={segments[index].dashOffset}
            />
          ))}
        </svg>
        <ul className="w-full space-y-3">
          {items.map((item) => <li key={item.label} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><span className={`size-3 rounded-sm ${item.colorClass}`} aria-hidden="true" />{item.label}</span><strong>{item.formattedValue}</strong></li>)}
        </ul>
      </div>
    </section>
  )
}
