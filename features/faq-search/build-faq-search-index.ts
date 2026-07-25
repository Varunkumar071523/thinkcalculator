import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { getPublishedContent } from "@/features/content/content-registry"
import type { EditorialBlock, EditorialSection } from "@/types/editorial-content"
import type { FaqSearchDocument } from "@/types/faq-search"

function editorialBlockText(block: EditorialBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text
    case "list":
      return block.items.join(". ")
    case "callout":
      return `${block.title}. ${block.text}`
    case "table":
      return [block.caption, block.headers.join(", "), ...block.rows.map((row) => row.join(", "))].join(". ")
  }
}

function calculatorFaqDocuments(): FaqSearchDocument[] {
  return calculatorRegistry
    .filter((calculator) => calculator.status === "published")
    .flatMap((calculator) =>
      calculator.faqs.map((faq, index) => ({
        id: `faq:${calculator.slug}:${index}`,
        kind: "faq" as const,
        question: faq.question,
        body: faq.answer,
        source: calculator.title,
        href: `${calculator.canonicalPath}#faqs`,
        popular: calculator.badge === "popular",
      })),
    )
}

function calculatorExampleDocuments(): FaqSearchDocument[] {
  return calculatorRegistry
    .filter((calculator) => calculator.status === "published" && calculator.workedExample)
    .map((calculator) => {
      const example = calculator.workedExample!
      const body = [
        example.description,
        ...example.inputs.map((item) => `${item.label}: ${item.value}`),
        ...example.results.map((item) => `${item.label}: ${item.value}`),
      ].join(". ")
      return {
        id: `example:${calculator.slug}`,
        kind: "example" as const,
        question: example.title ?? `${calculator.title} worked example`,
        body,
        source: calculator.title,
        href: `${calculator.canonicalPath}#worked-example`,
        popular: calculator.badge === "popular",
      }
    })
}

// Sections nest arbitrarily deep (EditorialSection.subsections) and editorial-section.tsx already
// renders every level as real page content, so the index must walk the whole tree too — otherwise
// a guide that uses subsections would have that visible content silently unsearchable.
function flattenSections(sections: readonly EditorialSection[]): EditorialSection[] {
  return sections.flatMap((section) => [section, ...flattenSections(section.subsections ?? [])])
}

export function documentsForGuideSections(
  guide: Readonly<{ slug: string; title: string; canonicalPath: string }>,
  sections: readonly EditorialSection[],
): FaqSearchDocument[] {
  return flattenSections(sections).map((section) => ({
    id: `guide:${guide.slug}:${section.id}`,
    kind: "guide" as const,
    question: section.title,
    body: section.blocks.map(editorialBlockText).join(" "),
    source: guide.title,
    href: `${guide.canonicalPath}#${section.id}`,
  }))
}

// Guides only (not blogs). Every published guide today is Loans-category (Sprint 38); when
// Investments/Tax guides are published later they are indexed automatically, no change needed here.
function guideSectionDocuments(): FaqSearchDocument[] {
  return getPublishedContent()
    .filter((item) => item.type === "guide")
    .flatMap((guide) => documentsForGuideSections(guide, guide.sections))
}

export function buildFaqSearchIndex(): readonly FaqSearchDocument[] {
  return [...calculatorFaqDocuments(), ...calculatorExampleDocuments(), ...guideSectionDocuments()]
}
