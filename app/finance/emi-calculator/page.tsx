import {
  CalculatorPageLayout,
  CalculatorSection,
  FAQSection,
  FormulaSection,
  RelatedCalculators,
  WorkedExampleSection,
  getRelatedCalculators,
} from "@/features/calculators/core"
import { EMICalculator, emiCalculatorDefinition } from "@/features/calculators/emi"
import { siteConfig } from "@/lib/site-config"
import { createCalculatorMetadata } from "@/lib/seo"

const calculator = emiCalculatorDefinition

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

export default function EMICalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <CalculatorPageLayout calculator={calculator} form={<EMICalculator />} result={null}>
        <CalculatorSection id="understanding-amortization" title="Understanding your amortization schedule" description="An amortization schedule is a month-by-month breakdown of how each EMI reduces your loan.">
          <div className="max-w-3xl space-y-4 leading-7 text-muted-foreground">
            <p>Every EMI contains principal and interest. Principal reduces the amount you borrowed, while interest is the cost charged on the outstanding balance.</p>
            <p>Early payments generally contain a larger interest component because the balance is higher. As the balance falls, more of the same EMI usually goes toward principal.</p>
            <p>The calculator results are estimates. A lender may use different rounding, payment dates, fees, or rate-change rules, so its repayment schedule may differ.</p>
          </div>
        </CalculatorSection>
        {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
        {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
        <FAQSection faqs={calculator.faqs} />
        <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
      </CalculatorPageLayout>
    </>
  )
}
