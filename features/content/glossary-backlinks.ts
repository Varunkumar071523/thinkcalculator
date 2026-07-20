import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { EditorialRelatedLink } from "@/types/editorial-content"
import { createGlossaryMatcher, linkGlossaryTermsInText } from "./glossary-linker"
import { getPublishedGlossaryTerms } from "./glossary-registry"

// Only calculators whose FAQ section actually renders auto-linked glossary terms this sprint
// (EMI, FD, RD — wired in their respective app/finance/*-calculator/page.tsx files). This list
// must stay in sync with those pages: it is what makes the reverse "used in" list on a glossary
// page match what a visitor can actually click through to from the calculator's FAQ answers,
// rather than claiming a link exists on a page that does not render one.
const GLOSSARY_LINKED_CALCULATOR_SLUGS: readonly string[] = ["emi-calculator", "fd-calculator", "rd-calculator"]

function computeCalculatorBacklinks(): ReadonlyMap<string, readonly EditorialRelatedLink[]> {
  const matcher = createGlossaryMatcher(getPublishedGlossaryTerms())
  const backlinks = new Map<string, EditorialRelatedLink[]>()
  for (const calculator of calculatorRegistry) {
    if (calculator.status !== "published") continue
    if (!GLOSSARY_LINKED_CALCULATOR_SLUGS.includes(calculator.slug)) continue
    const linkedSlugs = new Set<string>()
    for (const faq of calculator.faqs) linkGlossaryTermsInText(faq.answer, matcher, linkedSlugs)
    for (const slug of linkedSlugs) {
      const list = backlinks.get(slug) ?? []
      list.push({ title: calculator.title, href: calculator.canonicalPath, description: calculator.description })
      backlinks.set(slug, list)
    }
  }
  return backlinks
}

const calculatorBacklinksByTermSlug = computeCalculatorBacklinks()

export function getGlossaryCalculatorBacklinks(termSlug: string): readonly EditorialRelatedLink[] {
  return calculatorBacklinksByTermSlug.get(termSlug) ?? []
}
