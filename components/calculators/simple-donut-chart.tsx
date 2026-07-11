type DonutItem = { readonly label: string; readonly value: number; readonly formattedValue: string; readonly colorClass: string }

export function SimpleDonutChart({ title, items }: { readonly title: string; readonly items: readonly [DonutItem, DonutItem] }) {
  const total = items[0].value + items[1].value
  const firstPercent = total > 0 ? (items[0].value / total) * 100 : 100
  const description = `${items[0].label}: ${items[0].formattedValue}. ${items[1].label}: ${items[1].formattedValue}.`
  return (
    <section aria-labelledby="donut-title">
      <h2 id="donut-title" className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <svg className="size-40 shrink-0 -rotate-90" viewBox="0 0 42 42" role="img" aria-label={description}>
          <circle className="fill-none stroke-chart-2" cx="21" cy="21" r="15.9155" strokeWidth="8" />
          <circle className="fill-none stroke-chart-1" cx="21" cy="21" r="15.9155" strokeWidth="8" strokeDasharray={`${firstPercent} ${100 - firstPercent}`} />
        </svg>
        <ul className="w-full space-y-3">
          {items.map((item) => <li key={item.label} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><span className={`size-3 rounded-sm ${item.colorClass}`} aria-hidden="true" />{item.label}</span><strong>{item.formattedValue}</strong></li>)}
        </ul>
      </div>
    </section>
  )
}
