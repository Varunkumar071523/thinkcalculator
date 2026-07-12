import type { CalculatorContentReference } from "@/types/calculator-content"

export function ContentReferenceList({ references }: { references: readonly CalculatorContentReference[] }) {
  if (!references.length) return null
  return <section aria-labelledby="content-references-heading"><h3 id="content-references-heading" className="text-xl font-semibold">References</h3><ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">{references.map((reference) => <li key={reference.title}>{reference.url ? <a href={reference.url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4 hover:text-foreground">{reference.title}</a> : reference.title}{reference.organization ? ` — ${reference.organization}` : ""}</li>)}</ul></section>
}
