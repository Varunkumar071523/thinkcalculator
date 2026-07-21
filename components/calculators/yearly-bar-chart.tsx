"use client"

import { useEffect, useRef } from "react"
import { Chart, type ChartConfiguration } from "chart.js/auto"

export type YearlyBarChartSeries = {
  readonly label: string
  readonly values: readonly number[]
  /** A CSS custom property name (e.g. "--money") resolved at render time — never a literal hex value. */
  readonly colorVar: string
}

// Widened from a fixed 2-tuple to a 2-or-3-tuple so a calculator whose yearly breakdown has three
// parts (e.g. EPF's employee/employer/interest split) can reuse this chart instead of forking it.
// Every existing 2-series caller (EMI, PPF, retirement corpus, ...) keeps type-checking unchanged,
// since a 2-tuple is still one of the two accepted shapes.
type YearlyBarChartProps = {
  readonly labels: readonly string[]
  readonly series: readonly [YearlyBarChartSeries, YearlyBarChartSeries] | readonly [YearlyBarChartSeries, YearlyBarChartSeries, YearlyBarChartSeries]
  readonly formatTooltipValue: (value: number) => string
  readonly ariaLabel: string
}

function resolveColor(cssVar: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || "currentColor"
}

/** Compact ₹ axis labels (e.g. ₹12.5L, ₹1.2Cr) — full precision is reserved for tooltips. */
export function formatCompactINR(value: number): string {
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(abs >= 10_00_00_000 ? 0 : 1)}Cr`
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`
  return `${sign}₹${Math.round(abs)}`
}

export type YearlyBarChartDataset = { readonly label: string; readonly data: readonly number[]; readonly stack: "yearly" }

/** Pure series-to-dataset mapping (color resolution is kept out of this function since it reads
 * `document`/`getComputedStyle`, which only exist once mounted in a browser) — split out so the
 * 2-vs-3-series stacking behaviour is directly unit-testable without a DOM or Chart.js. */
export function buildStackedDatasets(series: YearlyBarChartProps["series"]): readonly YearlyBarChartDataset[] {
  return series.map((item) => ({ label: item.label, data: item.values, stack: "yearly" as const }))
}

/** Animated, stacked year-by-year bar chart (e.g. principal vs interest) built on Chart.js —
 * reusable across any calculator with a two-series yearly breakdown. Colors are read from CSS
 * custom properties at draw time so the chart always follows the active theme. */
export function YearlyBarChart({ labels, series, formatTooltipValue, ariaLabel }: YearlyBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart<"bar"> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const textColor = resolveColor("--muted-foreground")
    const gridColor = resolveColor("--border")

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: [...labels],
        datasets: buildStackedDatasets(series).map((dataset, index) => ({
          ...dataset,
          data: [...dataset.data],
          backgroundColor: resolveColor(series[index].colorVar),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500, easing: "easeOutQuart" },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 }, callback: (value) => formatCompactINR(Number(value)) },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatTooltipValue(Number(context.raw))}` } },
        },
      },
    }

    if (chartRef.current) {
      chartRef.current.data = config.data
      chartRef.current.options = config.options ?? {}
      chartRef.current.update()
    } else {
      chartRef.current = new Chart(canvas, config)
    }
  }, [labels, series, formatTooltipValue])

  useEffect(() => {
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [])

  return (
    <div className="relative h-[260px] w-full" role="img" aria-label={ariaLabel}>
      <canvas ref={canvasRef} />
    </div>
  )
}
