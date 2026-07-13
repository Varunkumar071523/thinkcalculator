export type EditorialSearchResultType = "blog" | "guide" | "glossary" | "topic"

export type EditorialSearchDocument = Readonly<{
  id: string
  type: EditorialSearchResultType
  title: string
  description: string
  canonicalPath: string
  context?: string
  searchable: Readonly<{
    title: string
    keywords: string
    description: string
  }>
}>

export type EditorialSearchState = Readonly<{
  query: string
  results: readonly EditorialSearchDocument[]
  truncated: boolean
}>
