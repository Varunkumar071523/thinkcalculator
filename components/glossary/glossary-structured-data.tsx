import { createCanonicalUrl } from "@/lib/seo"
import type { GlossaryTerm } from "@/types/glossary-content"

export function GlossaryStructuredData({ item }: { readonly item: GlossaryTerm }) {
  const data = { "@context": "https://schema.org", "@type": "DefinedTerm", name: item.term, description: item.shortDefinition, url: createCanonicalUrl(item.canonicalPath), inDefinedTermSet: { "@type": "DefinedTermSet", name: "ThinkCalculator Financial Glossary", url: createCanonicalUrl("/glossary") } }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
