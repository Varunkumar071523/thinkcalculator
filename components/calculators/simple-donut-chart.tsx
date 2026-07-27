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

export type DonutLabelPosition = { readonly xPercent: number; readonly yPercent: number }

/** Midpoint position of each segment's inline percentage label, as a 0-100 percentage of the
 * chart's own box. Matches the SVG's `-rotate-90` orientation, so 0% sits at 12 o'clock and
 * segments proceed clockwise from there, same as `computeDonutSegments`'s dash-offset walk.
 * Placed at ~37.5% radius from center — the ring itself sits at r=15.9155 of a 42-wide viewBox
 * (≈37.9%), so a label at this radius lands centered inside the stroke. Pure and unit-tested
 * separately from SVG rendering for the same reason `computeDonutSegments` is. */
export function computeDonutLabelPositions(segments: readonly DonutSegment[]): readonly DonutLabelPosition[] {
  const labelRadiusPercent = 37.5
  let cumulative = 0
  return segments.map((segment) => {
    const midpointPercent = cumulative + segment.percent / 2
    const angleRad = ((midpointPercent / 100) * 360 - 90) * (Math.PI / 180)
    cumulative += segment.percent
    return {
      xPercent: 50 + labelRadiusPercent * Math.cos(angleRad),
      yPercent: 50 + labelRadiusPercent * Math.sin(angleRad),
    }
  })
}

type SimpleDonutChartProps = {
  readonly title: string
  readonly items: readonly [DonutItem, DonutItem] | readonly [DonutItem, DonutItem, DonutItem]
  /** Defaults to false, matching every existing caller's external-legend-only rendering exactly.
   * When true, adds a percentage label directly on each donut segment and switches the legend
   * below from a stacked list to a compact horizontal row — trades some legend density for a
   * smaller vertical footprint, so it's opt-in rather than the default. */
  readonly showInlineLabels?: boolean
}

// Widened from a fixed 2-tuple to a 2-or-3-tuple so a calculator whose breakdown has three parts
// (e.g. NPS's equity/corporate debt/govt securities allocation) can reuse this chart instead of
// forking it. Every existing 2-item caller (EMI, PPF, retirement corpus, ...) keeps type-checking
// unchanged, since a 2-tuple is still one of the two accepted shapes.
export function SimpleDonutChart({ title, items, showInlineLabels = false }: SimpleDonutChartProps) {
  const segments = computeDonutSegments(items)
  const labelPositions = showInlineLabels ? computeDonutLabelPositions(segments) : null
  const description = items.map((item) => `${item.label}: ${item.formattedValue}.`).join(" ")

  const rings = (
    <svg className={showInlineLabels ? "size-40 -rotate-90" : "size-40 shrink-0 -rotate-90"} viewBox="0 0 42 42" role="img" aria-label={description}>
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
  )

  return (
    <section aria-labelledby="donut-title">
      <h2 id="donut-title" className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        {showInlineLabels ? (
          <div className="relative size-40 shrink-0">
            {rings}
            {items.map((item, index) =>
              segments[index].percent >= 1 ? (
                <span
                  key={item.label}
                  aria-hidden="true"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-white/90 px-1 py-0.5 text-[10px] font-bold text-ink shadow-sm"
                  style={{ left: `${labelPositions![index].xPercent}%`, top: `${labelPositions![index].yPercent}%` }}
                >
                  {Math.round(segments[index].percent)}%
                </span>
              ) : null,
            )}
          </div>
        ) : rings}
        <ul className={showInlineLabels ? "flex w-full flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm sm:justify-start" : "w-full space-y-3"}>
          {items.map((item) => (
            <li key={item.label} className={showInlineLabels ? "flex items-center gap-1.5" : "flex items-center justify-between gap-4"}>
              <span className="flex items-center gap-2"><span className={`size-3 rounded-sm ${item.colorClass}`} aria-hidden="true" />{item.label}</span>
              <strong>{item.formattedValue}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
