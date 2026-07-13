import type { CalculatorDefinition } from "@/types/calculator"
import type { EditorialContentItem } from "@/types/editorial-content"
import type { GlossaryTerm } from "@/types/glossary-content"

export type TopicStatus = "draft" | "published"

export type TopicSection = Readonly<{
  title: string
  description: string
  resourceId: string
}>

export type TopicDefinition = Readonly<{
  id: string
  slug: string
  name: string
  description: string
  canonicalPath: string
  status: TopicStatus
  metadata: Readonly<{ title: string; description: string; keywords?: readonly string[] }>
  overview: readonly string[]
  startHere: readonly TopicSection[]
  calculatorIds: readonly string[]
  editorialIds: readonly string[]
  glossaryIds: readonly string[]
}>

export type ResolvedTopic = Readonly<{
  definition: TopicDefinition
  calculators: readonly CalculatorDefinition[]
  blogs: readonly EditorialContentItem[]
  guides: readonly EditorialContentItem[]
  glossaryTerms: readonly GlossaryTerm[]
  unresolvedReferences: readonly string[]
}>
