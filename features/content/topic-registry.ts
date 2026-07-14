import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { ResolvedTopic, TopicDefinition } from "@/types/topic-content"
import { contentRegistry } from "./content-registry"
import { glossaryRegistry } from "./glossary-registry"

export const topicRegistry: readonly TopicDefinition[] = [
  {
    id: "topic-loans", slug: "loans", name: "Loans", canonicalPath: "/topics/loans", status: "published",
    description: "Learn how loan amounts, interest rates, and tenure shape EMI and total repayment.",
    metadata: { title: "Loans: EMI, Interest, and Repayment Guides", description: "Explore loan calculators, practical guides, articles, and glossary terms for understanding EMI, interest, tenure, and repayment costs.", keywords: ["loan calculators", "EMI guide", "loan repayment"] },
    overview: [
      "A useful loan comparison begins with more than the monthly instalment. The amount borrowed, interest rate, and repayment tenure work together to determine both EMI and total interest.",
      "Use this hub to estimate a repayment scenario, understand the calculation, and check the terms that commonly cause a lender's figures to differ from an estimate.",
    ],
    startHere: [
      { title: "Understand the moving parts", description: "Begin with an explanation of how principal, interest rate, and tenure shape EMI.", resourceId: "blog-understanding-loan-emi" },
      { title: "Learn the key term", description: "Check the plain-language EMI definition and how it relates to a reducing-balance calculation.", resourceId: "glossary-emi" },
      { title: "Follow the practical guide", description: "Learn how to enter loan inputs and interpret payment, interest, and schedule results.", resourceId: "guide-use-emi" },
      { title: "Estimate a scenario", description: "Use the EMI Calculator with the amount, annual rate, and repayment period you want to compare.", resourceId: "emi-calculator" },
    ],
    calculatorIds: ["emi-calculator"],
    editorialIds: ["blog-understanding-loan-emi", "guide-use-emi"],
    glossaryIds: ["glossary-emi", "glossary-principal", "glossary-interest-rate", "glossary-tenure"],
  },
  {
    id: "topic-investing", slug: "investing", name: "Investing", canonicalPath: "/topics/investing", status: "published",
    description: "Explore how contribution timing, duration, and assumed returns affect investment projections.",
    metadata: { title: "Investing: SIP, Lumpsum, and CAGR Learning Hub", description: "Use SIP, lumpsum, and CAGR calculators with clear guides, articles, and glossary terms about contributions, compounding, annualised growth, and projection limits.", keywords: ["SIP calculator guide", "lumpsum investing", "CAGR calculator", "investment projections"] },
    overview: [
      "Investment calculators show scenarios, not forecasts. A SIP models regular contributions, while a lumpsum calculation starts with one amount; both depend heavily on the return and duration assumptions entered.",
      "Use this hub to choose the matching contribution pattern, separate money invested from estimated growth, and understand why real market outcomes can vary or be negative.",
    ],
    startHere: [
      { title: "Compare contribution patterns", description: "Understand the difference between regular SIP contributions and an amount invested once.", resourceId: "blog-sip-vs-lumpsum" },
      { title: "Learn the key term", description: "Check what SIP means and how contribution timing affects a projection.", resourceId: "glossary-sip" },
      { title: "Follow the practical guide", description: "Learn how contribution, duration, and return assumptions shape a SIP estimate.", resourceId: "guide-estimate-sip" },
      { title: "Build a transparent scenario", description: "Use the SIP Calculator and treat the assumed return as an illustration rather than a prediction.", resourceId: "sip-calculator" },
    ],
    calculatorIds: ["sip-calculator", "step-up-sip-calculator", "swp-calculator", "lumpsum-calculator", "cagr-calculator", "inflation-calculator", "retirement-corpus-calculator"],
    editorialIds: ["blog-sip-vs-lumpsum", "guide-estimate-sip"],
    glossaryIds: ["glossary-sip", "glossary-step-up-sip", "glossary-swp", "glossary-compounding", "glossary-cagr", "glossary-principal", "glossary-tenure", "glossary-inflation", "glossary-retirement-corpus"],
  },
  {
    id: "topic-savings", slug: "savings", name: "Savings", canonicalPath: "/topics/savings", status: "published",
    description: "Deposit and savings calculations.",
    metadata: { title: "Savings Learning Hub", description: "A future learning hub for savings calculators and educational resources." },
    overview: ["This candidate remains private until it has a useful mix of reviewed learning resources."],
    startHere: [], calculatorIds: ["fd-calculator", "rd-calculator", "ppf-calculator"], editorialIds: [], glossaryIds: ["glossary-ppf"],
  },
  {
    id: "topic-borrowing-basics", slug: "borrowing-basics", name: "Borrowing Basics", canonicalPath: "/topics/borrowing-basics", status: "draft",
    description: "A draft learning cluster used to validate publication exclusion.",
    metadata: { title: "Borrowing Basics Learning Hub", description: "A draft topic definition that is not available on public routes." },
    overview: ["This draft is intentionally unavailable while its scope is reviewed."],
    startHere: [{ title: "Review the scope", description: "Keep this definition private until editorial review is complete.", resourceId: "blog-understanding-loan-emi" }],
    calculatorIds: ["emi-calculator"], editorialIds: ["blog-understanding-loan-emi", "guide-use-emi"], glossaryIds: ["glossary-emi"],
  },
]

export function resolveTopic(topic: TopicDefinition): ResolvedTopic {
  const calculators = topic.calculatorIds.map((id) => calculatorRegistry.find((item) => item.id === id)).filter((item) => item !== undefined)
  const editorial = topic.editorialIds.map((id) => contentRegistry.find((item) => item.id === id)).filter((item) => item !== undefined)
  const glossaryTerms = topic.glossaryIds.map((id) => glossaryRegistry.find((item) => item.id === id)).filter((item) => item !== undefined)
  const resolvedIds = new Set([...calculators, ...editorial, ...glossaryTerms].map((item) => item.id))
  return {
    definition: topic,
    calculators,
    blogs: editorial.filter((item) => item.type === "blog"),
    guides: editorial.filter((item) => item.type === "guide"),
    glossaryTerms,
    unresolvedReferences: [...new Set([
      ...topic.calculatorIds,
      ...topic.editorialIds,
      ...topic.glossaryIds,
      ...topic.startHere.map((step) => step.resourceId),
    ])].filter((id) => !resolvedIds.has(id)),
  }
}

export function isSubstantiveTopic(topic: TopicDefinition): boolean {
  const resolved = resolveTopic(topic)
  const referencesArePublished = [...resolved.calculators, ...resolved.blogs, ...resolved.guides, ...resolved.glossaryTerms].every((item) => item.status === "published")
  const learningPathIds = topic.startHere.map((step) => step.resourceId)
  return topic.overview.join(" ").length >= 200 && topic.startHere.length >= 3 && new Set(learningPathIds).size === learningPathIds.length && resolved.unresolvedReferences.length === 0 && referencesArePublished && resolved.calculators.length > 0 && resolved.blogs.length > 0 && resolved.guides.length > 0 && resolved.glossaryTerms.length > 0
}

export function getPublicTopics(): readonly ResolvedTopic[] { return topicRegistry.filter((topic) => topic.status === "published" && isSubstantiveTopic(topic)).map(resolveTopic) }
export function getTopicBySlug(slug: string): TopicDefinition | undefined { return topicRegistry.find((topic) => topic.slug === slug) }
export function getPublicTopicBySlug(slug: string): ResolvedTopic | undefined { const topic = getTopicBySlug(slug); return topic && topic.status === "published" && isSubstantiveTopic(topic) ? resolveTopic(topic) : undefined }
export function getTopicStaticParams() { return getPublicTopics().map(({ definition }) => ({ slug: definition.slug })) }
