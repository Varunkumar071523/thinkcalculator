import { CalculatorContentLayout } from "@/components/content/calculator-content-layout"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { CalculatorBreadcrumbs } from "@/features/calculators/core/calculator-breadcrumbs"
import { ClusterNavigation } from "@/components/topics/cluster-navigation"
import { SiteContainer } from "@/components/layout/site-container"
import { Badge } from "@/components/ui/badge"
import {
  FAQSection,
  FormulaSection,
  RelatedCalculators,
  WorkedExampleSection,
  getRelatedCalculators,
} from "@/features/calculators/core"
import {
  GratuityCalculator,
  gratuityCalculatorDefinition,
  gratuityKnowledgeContent,
} from "@/features/calculators/gratuity"
import { createCalculatorMetadata } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

const calculator = gratuityCalculatorDefinition
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
      featureList: "Standard monthly rated gratuity estimate, six-month service boundary, statutory ceiling, validated sharing, copy, and print support",
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

export default function GratuityCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <SiteContainer className="py-8 sm:py-10">
        <CalculatorBreadcrumbs category={calculator.category} calculatorTitle={calculator.shortTitle} />
        <header className="mt-6 max-w-2xl">
          <Badge className="bg-cat-tax-soft text-cat-tax" variant="outline">{calculator.category}</Badge>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{calculator.title}</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{calculator.description}</p>
        </header>
        <div className="mt-8">
          <GratuityCalculator />
        </div>
        <div className="mt-16 space-y-6 sm:mt-20 sm:space-y-8">
          {calculator.formula || calculator.workedExample ? (
            <CollapsibleSection title="Formula and worked example" description="How the gratuity estimate is calculated, with a sample case worked through step by step.">
              <div className="space-y-12">
                {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
                {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
              </div>
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection title={gratuityKnowledgeContent.title} description={gratuityKnowledgeContent.description}>
            <CalculatorContentLayout content={gratuityKnowledgeContent} />
          </CollapsibleSection>
          <CollapsibleSection title="Frequently asked questions" description="Common questions about gratuity and how this calculator works.">
            <FAQSection faqs={calculator.faqs} />
          </CollapsibleSection>
          <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
        </div>
        <ClusterNavigation resourceId={calculator.id} className="mt-16 sm:mt-20" />
      </SiteContainer>
    </>
  )
}
