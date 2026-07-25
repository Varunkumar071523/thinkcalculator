import { cn } from "@/lib/utils"

type FilterCategory = { readonly slug: string; readonly name: string }

export function BlogCategoryFilter({
  categories,
  selected,
  onChange,
}: {
  readonly categories: readonly FilterCategory[]
  readonly selected: string | null
  readonly onChange: (slug: string | null) => void
}) {
  return (
    <div role="group" aria-label="Filter posts by category" className="flex flex-wrap gap-2">
      <FilterChip active={selected === null} onClick={() => onChange(null)}>
        All
      </FilterChip>
      {categories.map((category) => (
        <FilterChip key={category.slug} active={selected === category.slug} onClick={() => onChange(category.slug)}>
          {category.name}
        </FilterChip>
      ))}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { readonly active: boolean; readonly onClick: () => void; readonly children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-ink bg-ink text-white" : "border-line bg-card text-muted-foreground hover:border-ink-soft",
      )}
    >
      {children}
    </button>
  )
}
