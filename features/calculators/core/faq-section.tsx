import { ChevronDown } from "lucide-react"

import { GlossaryLinkedText } from "@/components/content/glossary-linked-text"
import { CalculatorSection } from "@/features/calculators/core/calculator-section"
import { createGlossaryMatcher, linkGlossaryTermsInText } from "@/features/content/glossary-linker"
import type { CalculatorFAQ } from "@/types/calculator"
import type { GlossaryTerm } from "@/types/glossary-content"

// `glossaryTerms` is opt-in: when omitted, answers render as plain text exactly as before, so
// calculators that have not been validated against the glossary auto-linker are unaffected.
export function FAQSection({ faqs, glossaryTerms }: { readonly faqs: readonly CalculatorFAQ[]; readonly glossaryTerms?: readonly GlossaryTerm[] }) {
  if (faqs.length === 0) return null

  const matcher = glossaryTerms?.length ? createGlossaryMatcher(glossaryTerms) : null
  const linkedSlugs = new Set<string>()

  return (
    <CalculatorSection id="faqs" title="Frequently asked questions">
      <div className="divide-y rounded-xl border">
        {faqs.map((faq) => (
          <details key={faq.question} className="group px-5 py-4 open:bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {faq.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pt-3 leading-7 text-muted-foreground">
              {matcher ? <GlossaryLinkedText segments={linkGlossaryTermsInText(faq.answer, matcher, linkedSlugs)} /> : faq.answer}
            </p>
          </details>
        ))}
      </div>
    </CalculatorSection>
  )
}
