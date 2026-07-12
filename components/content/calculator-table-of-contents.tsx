import type { CalculatorTableOfContentsItem } from "@/types/calculator-content"

export function CalculatorTableOfContents({ items }: { items: readonly CalculatorTableOfContentsItem[] }) {
  return <nav aria-label="On this page" className="rounded-xl border bg-muted/30 p-5 lg:sticky lg:top-24"><h3 className="font-semibold">On this page</h3><ol className="mt-3 space-y-2 text-sm">{items.map((item) => <li key={item.id}><a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`#${item.id}`}>{item.title}</a></li>)}</ol></nav>
}
