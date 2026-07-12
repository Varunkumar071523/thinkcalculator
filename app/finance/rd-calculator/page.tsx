import { CalculatorPageLayout, FAQSection, FormulaSection, RelatedCalculators, WorkedExampleSection, getRelatedCalculators } from "@/features/calculators/core"
import { RDCalculator, rdCalculatorDefinition } from "@/features/calculators/rd"
import { siteConfig } from "@/lib/site-config"
import { createCalculatorMetadata } from "@/lib/seo"

const calculator = rdCalculatorDefinition
export const metadata = createCalculatorMetadata(calculator)
const structuredData = { "@context": "https://schema.org", "@graph": [
  { "@type": "WebApplication", name: calculator.title, url: `${siteConfig.url}${calculator.canonicalPath}`, description: calculator.description, applicationCategory: "FinanceApplication", operatingSystem: "Any", browserRequirements: "Requires a modern web browser" },
  { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Finance", item: `${siteConfig.url}/finance` }, { "@type": "ListItem", position: 3, name: calculator.title, item: `${siteConfig.url}${calculator.canonicalPath}` }] },
  { "@type": "FAQPage", mainEntity: calculator.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
] }

export default function RDCalculatorPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <CalculatorPageLayout calculator={calculator} form={<RDCalculator />} result={null}>
      <section aria-labelledby="rd-estimate-heading" className="max-w-3xl"><h2 id="rd-estimate-heading" className="text-2xl font-semibold tracking-tight">How to use this RD estimate</h2><p className="mt-3 leading-7 text-muted-foreground">This India-focused calculator assumes each instalment is deposited at the beginning of the month. It provides an educational estimate, not personalised financial advice. Actual bank calculations may differ because of bank-specific rules, deposit dates, compounding conventions, premature closure, penalties, and taxes.</p></section>
      {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
      {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
      <FAQSection faqs={calculator.faqs} /><RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
    </CalculatorPageLayout>
  </>
}
