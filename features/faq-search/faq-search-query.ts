import Fuse, { type IFuseOptions } from "fuse.js"

import type { FaqSearchDocument } from "@/types/faq-search"

export const FAQ_SEARCH_QUERY_MAX_LENGTH = 120
export const FAQ_SEARCH_RESULT_LIMIT = 5
// Below this length, a fuzzy match against ~150+ short question/body fields is mostly noise (e.g.
// "a" or "e" alone matches acronym-heavy titles like EMI/EPF/NPS/CAGR) rather than genuine intent,
// so shorter input falls back to the same default suggestions shown before typing.
export const FAQ_SEARCH_MIN_QUERY_LENGTH = 2

// Fuse.js scores 0 (perfect match) to 1 (no match); 0.4 keeps loose typo-tolerant matches while
// filtering out results irrelevant enough that the no-match fallback should show instead.
const FAQ_SEARCH_SCORE_THRESHOLD = 0.4

const FAQ_SEARCH_OPTIONS: IFuseOptions<FaqSearchDocument> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: FAQ_SEARCH_SCORE_THRESHOLD,
  // Multi-word queries ("SIP step up") should require every word to match somewhere rather than
  // fuzzy-matching the whole phrase as one string (which almost never hits) or matching on any
  // single word (which is too loose and surfaces irrelevant results for unrelated queries).
  useTokenSearch: true,
  tokenMatch: "all",
  keys: [
    { name: "question", weight: 0.7 },
    { name: "body", weight: 0.2 },
    { name: "source", weight: 0.1 },
  ],
}

export function createFaqSearchEngine(documents: readonly FaqSearchDocument[]): Fuse<FaqSearchDocument> {
  return new Fuse(documents as FaqSearchDocument[], FAQ_SEARCH_OPTIONS)
}

export function searchFaqDocuments(
  engine: Fuse<FaqSearchDocument>,
  rawQuery: string,
  limit = FAQ_SEARCH_RESULT_LIMIT,
): readonly FaqSearchDocument[] {
  const query = rawQuery.trim().slice(0, FAQ_SEARCH_QUERY_MAX_LENGTH)
  if (!query) return []
  return engine.search(query, { limit }).map((result) => result.item)
}

export function getDefaultFaqSuggestions(
  documents: readonly FaqSearchDocument[],
  limit = FAQ_SEARCH_RESULT_LIMIT,
): readonly FaqSearchDocument[] {
  const popular = documents.filter((document) => document.popular)
  const rest = documents.filter((document) => !document.popular)
  return [...popular, ...rest].slice(0, limit)
}

export function isFaqSearchQueryTooShort(rawQuery: string): boolean {
  return rawQuery.trim().length < FAQ_SEARCH_MIN_QUERY_LENGTH
}

// Single entry point the widget calls: below the minimum length, returns the same default
// suggestions shown before typing rather than running a fuzzy search on ~1-2 characters.
export function getFaqSearchResults(
  documents: readonly FaqSearchDocument[],
  engine: Fuse<FaqSearchDocument>,
  rawQuery: string,
  limit = FAQ_SEARCH_RESULT_LIMIT,
): readonly FaqSearchDocument[] {
  if (isFaqSearchQueryTooShort(rawQuery)) return getDefaultFaqSuggestions(documents, limit)
  return searchFaqDocuments(engine, rawQuery, limit)
}
