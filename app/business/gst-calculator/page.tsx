import { CalculatorContentLayout } from "@/components/content/calculator-content-layout"
import { CalculatorPageLayout, FAQSection, FormulaSection, RelatedCalculators, WorkedExampleSection, getRelatedCalculators } from "@/features/calculators/core"
import { GSTCalculator, gstCalculatorDefinition, gstKnowledgeContent } from "@/features/calculators/gst"
import { createCalculatorMetadata } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

const calculator = gstCalculatorDefinition
export const metadata = createCalculatorMetadata(calculator)
const structuredData = { "@context": "https://schema.org", "@graph": [
  { "@type": "WebApplication", name: calculator.title, url: `${siteConfig.url}${calculator.canonicalPath}`, description: calculator.description, applicationCategory: "BusinessApplication", operatingSystem: "Any", browserRequirements: "Requires a modern web browser", featureList: "Add or remove entered GST, custom arithmetic rates, user-selected CGST/SGST/UTGST or IGST breakdown, shareable inputs, and print support" },
  { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Business", item: `${siteConfig.url}/business` }, { "@type": "ListItem", position: 3, name: calculator.title, item: `${siteConfig.url}${calculator.canonicalPath}` }] },
  { "@type": "FAQPage", mainEntity: calculator.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
] }

export default function GSTCalculatorPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><CalculatorPageLayout calculator={calculator} form={<GSTCalculator />} result={null}>{calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}{calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}<CalculatorContentLayout content={gstKnowledgeContent} /><FAQSection faqs={calculator.faqs} /><RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} /></CalculatorPageLayout></>
}
