import type { ReactNode } from "react"

const WIDTH = 900
const HEIGHT = 320
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 20
const PAD_BOTTOM = 34

function formatCompactINR(value: number): string {
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(abs >= 10_00_00_000 ? 0 : 1)}Cr`
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`
  return `${sign}₹${Math.round(abs)}`
}

/** Evenly spaced indices across [0, n-1], deduplicated — used for axis ticks and milestone picks. */
function pickIndices(n: number, count: number): readonly number[] {
  if (n <= count) return Array.from({ length: n }, (_, i) => i)
  const result = new Set<number>()
  for (let k = 0; k < count; k++) result.add(Math.round((k / (count - 1)) * (n - 1)))
  return Array.from(result).sort((a, b) => a - b)
}

/** Skips the first point (already implied by the axis) and spreads 3 picks toward the final period —
 * for a 15-entry series this lands on indices 4/9/14, i.e. Year 5 / Year 10 / Year 15. */
export function pickMilestoneIndices(n: number): readonly number[] {
  if (n <= 3) return Array.from({ length: n }, (_, i) => i)
  const a = Math.max(0, Math.round(n / 3) - 1)
  const b = Math.max(a + 1, Math.round((2 * n) / 3) - 1)
  const c = n - 1
  return Array.from(new Set([a, b, c])).sort((x, y) => x - y)
}

function scaleY(amount: number, maxAmount: number): number {
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  if (maxAmount <= 0) return HEIGHT - PAD_BOTTOM
  return PAD_TOP + (1 - amount / maxAmount) * plotHeight
}

function scaleX(index: number, count: number): number {
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  return count <= 1 ? PAD_LEFT : PAD_LEFT + (index / (count - 1)) * plotWidth
}

/** A gently smoothed path through real data points (quadratic curve via consecutive midpoints) —
 * reads as "curved" for the naturally convex compounding series without fabricating the shape. */
function smoothPath(coords: readonly { readonly x: number; readonly y: number }[]): string {
  if (coords.length < 3) return `M ${coords.map((point) => `${point.x},${point.y}`).join(" L ")}`
  let path = `M ${coords[0].x},${coords[0].y}`
  for (let i = 1; i < coords.length - 1; i++) {
    const midX = (coords[i].x + coords[i + 1].x) / 2
    const midY = (coords[i].y + coords[i + 1].y) / 2
    path += ` Q ${coords[i].x},${coords[i].y} ${midX},${midY}`
  }
  const last = coords[coords.length - 1]
  path += ` L ${last.x},${last.y}`
  return path
}

function ChartFrame({ maxAmount, xTicks, children }: { readonly maxAmount: number; readonly xTicks: readonly { readonly x: number; readonly label: string }[]; readonly children: ReactNode }) {
  const baseline = HEIGHT - PAD_BOTTOM
  const gridFractions = [0.25, 0.5, 0.75]
  return (
    <svg className="h-auto w-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
      <g className="stroke-border" strokeWidth={1}>
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={baseline} />
        <line x1={PAD_LEFT} y1={baseline} x2={WIDTH - PAD_RIGHT} y2={baseline} />
        {gridFractions.map((fraction) => {
          const y = PAD_TOP + (1 - fraction) * (baseline - PAD_TOP)
          return <line key={fraction} x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} strokeDasharray="3,4" />
        })}
      </g>
      <g className="fill-muted-foreground font-mono text-[11px]">
        <text x={4} y={baseline + 4}>₹0</text>
        {gridFractions.map((fraction) => <text key={fraction} x={4} y={PAD_TOP + (1 - fraction) * (baseline - PAD_TOP) + 4}>{formatCompactINR(fraction * maxAmount)}</text>)}
        <text x={4} y={PAD_TOP + 4}>{formatCompactINR(maxAmount)}</text>
      </g>
      {children}
      <g className="fill-muted-foreground font-mono text-[11px]">
        {xTicks.map((tick) => <text key={tick.x} x={tick.x} y={HEIGHT - 10} textAnchor={tick.x <= PAD_LEFT ? "start" : tick.x >= WIDTH - PAD_RIGHT ? "end" : "middle"}>{tick.label}</text>)}
      </g>
    </svg>
  )
}

export type GrowthChartPoint = { readonly label: string; readonly invested: number; readonly value: number }

/** Two-line growth chart: a straight line for cumulative invested amount, and a smoothed line for
 * estimated total value — visually distinguishing steady contributions from compounding growth. */
export function GrowthLineChart({ points, investedLabel = "Amount invested", valueLabel = "Total value (estimated)" }: { readonly points: readonly GrowthChartPoint[]; readonly investedLabel?: string; readonly valueLabel?: string }) {
  if (points.length === 0) return null
  const n = points.length
  const maxAmount = Math.max(...points.map((point) => point.value), 1)
  const baseline = HEIGHT - PAD_BOTTOM

  const investedCoords = points.map((point, index) => ({ x: scaleX(index, n), y: scaleY(point.invested, maxAmount) }))
  const valueCoords = points.map((point, index) => ({ x: scaleX(index, n), y: scaleY(point.value, maxAmount) }))
  const investedAreaPoints = [`${investedCoords[0].x},${baseline}`, ...investedCoords.map((coord) => `${coord.x},${coord.y}`), `${investedCoords[n - 1].x},${baseline}`].join(" ")
  const xTicks = pickIndices(n, 4).map((index) => ({ x: scaleX(index, n), label: points[index].label }))
  const last = points[n - 1]
  const description = `${valueLabel} reaches ${formatCompactINR(last.value)} against ${investedLabel.toLowerCase()} of ${formatCompactINR(last.invested)} by ${last.label}. See the yearly table for exact figures.`

  return (
    <div>
      <ul className="flex flex-wrap gap-5 text-[13px] text-muted-foreground">
        <li className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-full bg-cat-invest" aria-hidden="true" />{valueLabel}</li>
        <li className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-full bg-gold" aria-hidden="true" />{investedLabel}</li>
      </ul>
      <div className="mt-4">
        <ChartFrame maxAmount={maxAmount} xTicks={xTicks}>
          <g role="img" aria-label={description}>
            <polygon points={investedAreaPoints} className="fill-gold-soft" opacity={0.7} />
            <polyline points={investedCoords.map((coord) => `${coord.x},${coord.y}`).join(" ")} className="fill-none stroke-gold" strokeWidth={2.5} />
            <path d={smoothPath(valueCoords)} className="fill-none stroke-cat-invest" strokeWidth={3} />
            <circle cx={valueCoords[n - 1].x} cy={valueCoords[n - 1].y} r={5} className="fill-cat-invest" />
            <circle cx={investedCoords[n - 1].x} cy={investedCoords[n - 1].y} r={5} className="fill-gold" />
          </g>
        </ChartFrame>
      </div>
    </div>
  )
}

export type BalanceChartPoint = { readonly label: string; readonly balance: number }

/** Single declining line for depletion projections (e.g. SWP) — the inverse shape of GrowthLineChart. */
export function DecliningBalanceChart({ points, label = "Balance" }: { readonly points: readonly BalanceChartPoint[]; readonly label?: string }) {
  if (points.length === 0) return null
  const n = points.length
  const maxAmount = Math.max(...points.map((point) => point.balance), 1)
  const baseline = HEIGHT - PAD_BOTTOM

  const coords = points.map((point, index) => ({ x: scaleX(index, n), y: scaleY(point.balance, maxAmount) }))
  const areaPoints = [`${coords[0].x},${baseline}`, ...coords.map((coord) => `${coord.x},${coord.y}`), `${coords[n - 1].x},${baseline}`].join(" ")
  const xTicks = pickIndices(n, 4).map((index) => ({ x: scaleX(index, n), label: points[index].label }))
  const last = points[n - 1]
  const description = `${label} declines from ${formatCompactINR(points[0].balance)} at ${points[0].label} to ${formatCompactINR(last.balance)} by ${last.label}. See the yearly table for exact figures.`

  return (
    <div>
      <ul className="flex flex-wrap gap-5 text-[13px] text-muted-foreground">
        <li className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-full bg-cat-invest" aria-hidden="true" />{label}</li>
      </ul>
      <div className="mt-4">
        <ChartFrame maxAmount={maxAmount} xTicks={xTicks}>
          <g role="img" aria-label={description}>
            <polygon points={areaPoints} className="fill-cat-invest-soft" opacity={0.8} />
            <polyline points={coords.map((coord) => `${coord.x},${coord.y}`).join(" ")} className="fill-none stroke-cat-invest" strokeWidth={2.5} />
            <circle cx={coords[n - 1].x} cy={coords[n - 1].y} r={5} className="fill-cat-invest" />
          </g>
        </ChartFrame>
      </div>
    </div>
  )
}

export type MilestoneItem = { readonly label: string; readonly value: string; readonly highlight?: boolean }

export function MilestoneRow({ items }: { readonly items: readonly MilestoneItem[] }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`rounded-lg border p-3 text-center ${item.highlight ? "border-cat-invest bg-cat-invest-soft" : "border-line bg-muted/30"}`}>
          <dt className={`font-mono text-[11px] uppercase tracking-wide ${item.highlight ? "text-cat-invest" : "text-muted-foreground"}`}>{item.label}</dt>
          <dd className="mt-1 font-mono text-sm font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
