export type FaqSearchDocumentKind = "faq" | "example" | "guide"

export type FaqSearchDocument = Readonly<{
  id: string
  kind: FaqSearchDocumentKind
  question: string
  body: string
  source: string
  href: string
  popular?: boolean
}>
