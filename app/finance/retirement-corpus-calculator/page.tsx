import {
  FAQSection,
  FormulaSection,
  RelatedCalculators,
  WorkedExampleSection,
  getRelatedCalculators,
} from "@/features/calculators/core"
import { CalculatorBreadcrumbs } from "@/features/calculators/core/calculator-breadcrumbs"
import { ClusterNavigation } from "@/components/topics/cluster-navigation"
import { CalculatorContentLayout } from "@/components/content/calculator-content-layout"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { SiteContainer } from "@/components/layout/site-container"
import { Badge } from "@/components/ui/badge"
import { RetirementCalculator, retirementCalculatorDefinition as calculator, retirementKnowledgeContent } from "@/features/calculators/retirement-corpus"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"

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

export default function RetirementCorpusCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteContainer className="py-8 sm:py-10">
        <CalculatorBreadcrumbs category={calculator.category} calculatorTitle={calculator.shortTitle} />
        <header className="mt-3 max-w-2xl">
          <Badge className="bg-cat-invest-soft text-cat-invest" variant="outline">{calculator.category}</Badge>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{calculator.title}</h1>
          <p className="mt-1.5 text-base leading-6 text-muted-foreground">{calculator.description}</p>
        </header>
        <div className="mt-4">
          <RetirementCalculator />
        </div>
        <div className="mt-16 space-y-6 sm:mt-20 sm:space-y-8">
          {calculator.formula || calculator.workedExample ? (
            <CollapsibleSection title="Formula and worked example" description="How the retirement corpus projection is calculated, with a sample scenario worked through step by step.">
              <div className="space-y-12">
                {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
                {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
              </div>
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection title={retirementKnowledgeContent.title} description={retirementKnowledgeContent.description}>
            <CalculatorContentLayout content={retirementKnowledgeContent} />
          </CollapsibleSection>
          <CollapsibleSection title="Frequently asked questions" description="Common questions about retirement corpus planning and how this calculator works.">
            <FAQSection faqs={calculator.faqs} />
          </CollapsibleSection>
          <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
        </div>
        <ClusterNavigation resourceId={calculator.id} className="mt-16 sm:mt-20" />
      </SiteContainer>
    </>
  )
}
