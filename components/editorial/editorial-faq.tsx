import { GlossaryLinkedText } from "@/components/content/glossary-linked-text"
import { createGlossaryMatcher, linkGlossaryTermsInText } from "@/features/content/glossary-linker"
import type { EditorialFAQ as FAQ } from "@/types/editorial-content"
import type { GlossaryTerm } from "@/types/glossary-content"
export function EditorialFAQ({ faqs, glossaryTerms }: { readonly faqs: readonly FAQ[]; readonly glossaryTerms?: readonly GlossaryTerm[] }) {
  if (!faqs.length) return null
  const matcher = glossaryTerms?.length ? createGlossaryMatcher(glossaryTerms) : null
  const linkedSlugs = new Set<string>()
  return <section aria-labelledby="editorial-faq"><h2 id="editorial-faq" className="text-2xl font-semibold">Frequently asked questions</h2><div className="mt-5 divide-y rounded-xl border">{faqs.map((faq) => <details key={faq.question} className="group p-5"><summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{faq.question}</summary><p className="mt-3 leading-7 text-muted-foreground">{matcher ? <GlossaryLinkedText segments={linkGlossaryTermsInText(faq.answer, matcher, linkedSlugs)} /> : faq.answer}</p></details>)}</div></section>
}
