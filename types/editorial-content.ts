export type EditorialContentType = "blog" | "guide"
export type EditorialStatus = "draft" | "published"

export type EditorialAuthor = Readonly<{ id: string; name: string; description: string }>
export type EditorialCategory = Readonly<{ slug: string; name: string; description: string }>
export type EditorialTag = Readonly<{ slug: string; name: string }>
export type EditorialMetadata = Readonly<{ title: string; description: string; keywords: readonly string[] }>
export type EditorialRelatedLink = Readonly<{ title: string; href: string; description: string }>
export type EditorialParagraph = Readonly<{ type: "paragraph"; text: string; links?: readonly Readonly<{ text: string; href: string; external?: boolean }>[] }>
export type EditorialList = Readonly<{ type: "list"; ordered: boolean; items: readonly string[] }>
export type EditorialCallout = Readonly<{ type: "callout"; title: string; text: string; tone?: "info" | "warning" }>
export type EditorialTable = Readonly<{ type: "table"; caption: string; headers: readonly string[]; rows: readonly (readonly string[])[] }>
export type EditorialBlock = EditorialParagraph | EditorialList | EditorialCallout | EditorialTable
export type EditorialSection = Readonly<{ id: string; title: string; blocks: readonly EditorialBlock[]; subsections?: readonly EditorialSection[] }>
export type EditorialFAQ = Readonly<{ question: string; answer: string }>
export type EditorialContentItem = Readonly<{
  id: string; slug: string; type: EditorialContentType; title: string; description: string; excerpt: string
  category: EditorialCategory; tags: readonly EditorialTag[]; author: EditorialAuthor; canonicalPath: string
  publishedAt: string; updatedAt?: string; status: EditorialStatus; estimatedReadingMinutes: number
  sections: readonly EditorialSection[]; faqs: readonly EditorialFAQ[]; relatedContent: readonly EditorialRelatedLink[]
  relatedCalculators: readonly EditorialRelatedLink[]; metadata: EditorialMetadata; disclaimer?: string
}>
export type EditorialContentSummary = Pick<EditorialContentItem, "id" | "slug" | "type" | "title" | "description" | "excerpt" | "category" | "tags" | "author" | "canonicalPath" | "publishedAt" | "estimatedReadingMinutes">
export type EditorialTableOfContentsItem = Readonly<{ id: string; title: string; children?: readonly EditorialTableOfContentsItem[] }>
