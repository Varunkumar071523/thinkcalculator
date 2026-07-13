import type { EditorialSearchDocument, EditorialSearchState } from "@/types/editorial-search"

export const EDITORIAL_SEARCH_QUERY_MAX_LENGTH = 120

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN")
}

export function normalizeEditorialSearchQuery(value: string): string {
  return normalizeText(value).slice(0, EDITORIAL_SEARCH_QUERY_MAX_LENGTH)
}

export function normalizeEditorialSearchText(values: readonly string[]): string {
  return normalizeText(values.filter(Boolean).join(" "))
}

export function getEditorialSearchQuery(searchParams: Pick<URLSearchParams, "get">): string {
  return normalizeEditorialSearchQuery(searchParams.get("q") ?? "")
}

export function createEditorialSearchHref(rawQuery: string): string {
  const query = normalizeEditorialSearchQuery(rawQuery)
  if (!query) return "/search"
  return `/search?${new URLSearchParams({ q: query }).toString()}`
}

function rankDocument(document: EditorialSearchDocument, query: string): number | undefined {
  if (document.searchable.title === query) return 0
  if (document.searchable.title.startsWith(query)) return 1
  if (document.searchable.title.includes(query)) return 2
  if (document.searchable.keywords.includes(query)) return 3
  if (document.searchable.description.includes(query)) return 4
  return undefined
}

export function searchEditorialDocuments(
  documents: readonly EditorialSearchDocument[],
  rawQuery: string,
): EditorialSearchState {
  const normalizedInput = normalizeText(rawQuery)
  const query = normalizeEditorialSearchQuery(rawQuery)
  const truncated = normalizedInput.length > EDITORIAL_SEARCH_QUERY_MAX_LENGTH

  if (!query) return { query: "", results: [], truncated }

  const ranked = documents.flatMap((document) => {
    const rank = rankDocument(document, query)
    return rank === undefined ? [] : [{ document, rank }]
  })

  ranked.sort((left, right) =>
    left.rank - right.rank
    || left.document.title.localeCompare(right.document.title, "en-IN", { sensitivity: "base" })
    || left.document.canonicalPath.localeCompare(right.document.canonicalPath, "en-IN"),
  )

  return { query, results: ranked.map(({ document }) => document), truncated }
}
