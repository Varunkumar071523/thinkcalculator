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
  EpsPensionCalculator,
  epsPensionCalculatorDefinition,
  epsPensionKnowledgeContent,
} from "@/features/calculators/eps-pension"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"

const calculator = epsPensionCalculatorDefinition
export const metadata = createCalculatorMetadata(calculator)

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: calculator.title,
      url: createCanonicalUrl(calculator.canonicalPath),
      description: calculator.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
      featureList: "EPS 2026 monthly pension estimate, wage-ceiling cap, 20-year bonus-service weightage, minimum-pension floor, optional early-pension estimate, validated sharing, copy, and print support",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: createCanonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "Finance", item: createCanonicalUrl("/finance") },
        { "@type": "ListItem", position: 3, name: calculator.title, item: createCanonicalUrl(calculator.canonicalPath) },
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

export default function EpsPensionCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <SiteContainer className="py-8 sm:py-10">
        <CalculatorBreadcrumbs category={calculator.category} calculatorTitle={calculator.shortTitle} />
        <header className="mt-3 max-w-2xl">
          <Badge className="bg-cat-savings-soft text-cat-savings" variant="outline">{calculator.category}</Badge>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{calculator.title}</h1>
          <p className="mt-1.5 text-base leading-6 text-muted-foreground">{calculator.description}</p>
        </header>
        <div className="mt-4">
          <EpsPensionCalculator />
        </div>
        <div className="mt-16 space-y-6 sm:mt-20 sm:space-y-8">
          {calculator.formula || calculator.workedExample ? (
            <CollapsibleSection title="Formula and worked example" description="How the EPS monthly pension is calculated, with a sample case worked through step by step.">
              <div className="space-y-12">
                {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
                {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
              </div>
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection title={epsPensionKnowledgeContent.title} description={epsPensionKnowledgeContent.description}>
            <CalculatorContentLayout content={epsPensionKnowledgeContent} />
          </CollapsibleSection>
          <CollapsibleSection title="Frequently asked questions" description="Common questions about the EPS pension and how this calculator works.">
            <FAQSection faqs={calculator.faqs} />
          </CollapsibleSection>
          <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
        </div>
        <ClusterNavigation resourceId={calculator.id} className="mt-16 sm:mt-20" />
      </SiteContainer>
    </>
  )
}
