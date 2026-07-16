import {
  CalculatorPageLayout,
  FAQSection,
  FormulaSection,
  RelatedCalculators,
  WorkedExampleSection,
  getRelatedCalculators,
} from "@/features/calculators/core"
import { CalculatorContentLayout } from "@/components/content/calculator-content-layout"
import { IncomeTaxCalculator, incomeTaxCalculatorDefinition, incomeTaxKnowledgeContent } from "@/features/calculators/income-tax"
import { siteConfig } from "@/lib/site-config"
import { createCalculatorMetadata } from "@/lib/seo"

const calculator = incomeTaxCalculatorDefinition

export const metadata = createCalculatorMetadata(calculator)

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: calculator.title,
      url: `${siteConfig.url}${calculator.canonicalPath}`,
      description: calculator.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Finance", item: `${siteConfig.url}/finance` },
        { "@type": "ListItem", position: 3, name: calculator.title, item: `${siteConfig.url}${calculator.canonicalPath}` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: calculator.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
}

export default function IncomeTaxCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <CalculatorPageLayout calculator={calculator} form={<IncomeTaxCalculator />} result={null}>
        {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
        {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
        <CalculatorContentLayout content={incomeTaxKnowledgeContent} />
        <FAQSection faqs={calculator.faqs} />
        <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
      </CalculatorPageLayout>
    </>
  )
}
