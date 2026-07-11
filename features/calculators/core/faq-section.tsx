import { ChevronDown } from "lucide-react"

import { CalculatorSection } from "@/features/calculators/core/calculator-section"
import type { CalculatorFAQ } from "@/types/calculator"

export function FAQSection({ faqs }: { readonly faqs: readonly CalculatorFAQ[] }) {
  if (faqs.length === 0) return null

  return (
    <CalculatorSection id="faqs" title="Frequently asked questions">
      <div className="divide-y rounded-xl border">
        {faqs.map((faq) => (
          <details key={faq.question} className="group px-5 py-4 open:bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {faq.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pt-3 leading-7 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </CalculatorSection>
  )
}
