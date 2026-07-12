import { CalculatorTableOfContents } from "@/components/content/calculator-table-of-contents"
import { ContentReferenceList } from "@/components/content/content-reference-list"
import { ContentSection } from "@/components/content/content-section"
import { RelatedLearningLinks } from "@/components/content/related-learning-links"
import type { CalculatorKnowledgeContent } from "@/types/calculator-content"

export function CalculatorContentLayout({ content }: { content: CalculatorKnowledgeContent }) {
  const items = content.sections.map(({ id, title }) => ({ id, title }))
  return <article aria-labelledby="calculator-knowledge-heading"><header className="max-w-3xl"><h2 id="calculator-knowledge-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{content.title}</h2><p className="mt-3 text-base leading-7 text-muted-foreground">{content.description}</p></header><div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]"><CalculatorTableOfContents items={items} /><div className="min-w-0 max-w-3xl space-y-12">{content.sections.map((section) => <ContentSection key={section.id} section={section} />)}<ContentReferenceList references={content.references ?? []} /><RelatedLearningLinks links={content.relatedLinks} /></div></div></article>
}
