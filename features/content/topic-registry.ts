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
      { title: "Understand the moving parts", description: "Begin with the EMI explanation and glossary definitions for principal, interest rate, and tenure." },
      { title: "Estimate a scenario", description: "Use the EMI Calculator with the loan amount, annual rate, and repayment period you want to compare." },
      { title: "Interpret the full cost", description: "Review total interest and the repayment schedule, then verify fees, rate rules, and payment timing with the lender." },
    ],
    calculatorIds: ["emi-calculator"],
    editorialIds: ["blog-understanding-loan-emi", "guide-use-emi"],
    glossaryIds: ["glossary-emi", "glossary-principal", "glossary-interest-rate", "glossary-tenure"],
  },
  {
    id: "topic-investing", slug: "investing", name: "Investing", canonicalPath: "/topics/investing", status: "published",
    description: "Explore how contribution timing, duration, and assumed returns affect investment projections.",
    metadata: { title: "Investing: SIP and Lumpsum Learning Hub", description: "Use SIP and lumpsum calculators with clear guides, articles, and glossary terms about contributions, compounding, duration, and projection limits.", keywords: ["SIP calculator guide", "lumpsum investing", "investment projections"] },
    overview: [
      "Investment calculators show scenarios, not forecasts. A SIP models regular contributions, while a lumpsum calculation starts with one amount; both depend heavily on the return and duration assumptions entered.",
      "Use this hub to choose the matching contribution pattern, separate money invested from estimated growth, and understand why real market outcomes can vary or be negative.",
    ],
    startHere: [
      { title: "Choose the contribution pattern", description: "Use SIP for regular contributions and lumpsum for an amount invested once." },
      { title: "Build a transparent scenario", description: "Enter a contribution, duration, and clearly understood illustrative return rather than treating an assumption as a prediction." },
      { title: "Compare and interpret", description: "Review invested amount separately from estimated gain, test more than one scenario, and remember that returns are not guaranteed." },
    ],
    calculatorIds: ["sip-calculator", "lumpsum-calculator"],
    editorialIds: ["blog-sip-vs-lumpsum", "guide-estimate-sip"],
    glossaryIds: ["glossary-sip", "glossary-compounding", "glossary-principal", "glossary-tenure"],
  },
  {
    id: "topic-savings", slug: "savings", name: "Savings", canonicalPath: "/topics/savings", status: "published",
    description: "Deposit and savings calculations.",
    metadata: { title: "Savings Learning Hub", description: "A future learning hub for savings calculators and educational resources." },
    overview: ["This candidate remains private until it has a useful mix of reviewed learning resources."],
    startHere: [], calculatorIds: ["fd-calculator", "rd-calculator"], editorialIds: [], glossaryIds: [],
  },
  {
    id: "topic-borrowing-basics", slug: "borrowing-basics", name: "Borrowing Basics", canonicalPath: "/topics/borrowing-basics", status: "draft",
    description: "A draft learning cluster used to validate publication exclusion.",
    metadata: { title: "Borrowing Basics Learning Hub", description: "A draft topic definition that is not available on public routes." },
    overview: ["This draft is intentionally unavailable while its scope is reviewed."],
    startHere: [{ title: "Review the scope", description: "Keep this definition private until editorial review is complete." }],
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
    unresolvedReferences: [...topic.calculatorIds, ...topic.editorialIds, ...topic.glossaryIds].filter((id) => !resolvedIds.has(id)),
  }
}

export function isSubstantiveTopic(topic: TopicDefinition): boolean {
  const resolved = resolveTopic(topic)
  const referencesArePublished = [...resolved.calculators, ...resolved.blogs, ...resolved.guides, ...resolved.glossaryTerms].every((item) => item.status === "published")
  return topic.overview.join(" ").length >= 200 && topic.startHere.length >= 3 && resolved.unresolvedReferences.length === 0 && referencesArePublished && resolved.calculators.length > 0 && resolved.blogs.length > 0 && resolved.guides.length > 0 && resolved.glossaryTerms.length > 0
}

export function getPublicTopics(): readonly ResolvedTopic[] { return topicRegistry.filter((topic) => topic.status === "published" && isSubstantiveTopic(topic)).map(resolveTopic) }
export function getTopicBySlug(slug: string): TopicDefinition | undefined { return topicRegistry.find((topic) => topic.slug === slug) }
export function getPublicTopicBySlug(slug: string): ResolvedTopic | undefined { const topic = getTopicBySlug(slug); return topic && topic.status === "published" && isSubstantiveTopic(topic) ? resolveTopic(topic) : undefined }
export function getTopicStaticParams() { return getPublicTopics().map(({ definition }) => ({ slug: definition.slug })) }
