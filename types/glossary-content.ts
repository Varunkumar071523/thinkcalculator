import type { EditorialRelatedLink, EditorialSection } from "@/types/editorial-content"

export type GlossaryStatus = "draft" | "published"
export type GlossaryTerm = Readonly<{
  id: string
  slug: string
  term: string
  shortDefinition: string
  canonicalPath: string
  status: GlossaryStatus
  sections: readonly EditorialSection[]
  relatedCalculators: readonly EditorialRelatedLink[]
  relatedContent: readonly EditorialRelatedLink[]
  metadata: Readonly<{ title: string; description: string; keywords: readonly string[] }>
}>
