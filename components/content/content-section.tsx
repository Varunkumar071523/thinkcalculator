import { ContentCallout } from "@/components/content/content-callout"
import { ContentComparisonTable } from "@/components/content/content-comparison-table"
import type { CalculatorContentSection } from "@/types/calculator-content"

export function ContentSection({ section }: { section: CalculatorContentSection }) {
  return <section id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-24"><h3 id={`${section.id}-heading`} className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h3><div className="mt-4 space-y-4">{section.content.map((block, index) => {
    if (block.type === "paragraph") return <p key={index} className="leading-7 text-muted-foreground">{block.text}</p>
    if (block.type === "callout") return <ContentCallout key={index} callout={block} />
    if (block.type === "table") return <ContentComparisonTable key={index} table={block} />
    const Tag = block.style === "numbered" ? "ol" : "ul"
    return <Tag key={index} className={`space-y-2 pl-6 leading-7 text-muted-foreground ${block.style === "numbered" ? "list-decimal" : "list-disc"}`}>{block.items.map((item) => <li key={item}>{item}</li>)}</Tag>
  })}</div></section>
}
