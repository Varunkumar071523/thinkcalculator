import { getPublishedContent } from "./content-registry"
import type { EditorialContentItem, EditorialContentSummary } from "@/types/editorial-content"

const DEFAULT_RELATED_POSTS_LIMIT = 3

/**
 * Related blog posts for a given post: same category first, falling back to a shared
 * linked calculator only when no same-category post exists (category is the stronger
 * editorial signal; calculator overlap is a looser topical link).
 */
export function getRelatedBlogPosts(item: EditorialContentItem, limit = DEFAULT_RELATED_POSTS_LIMIT): readonly EditorialContentSummary[] {
  const candidates = getPublishedContent().filter((candidate) => candidate.type === "blog" && candidate.id !== item.id)

  const sameCategory = candidates.filter((candidate) => candidate.category.slug === item.category.slug)
  if (sameCategory.length > 0) return sameCategory.slice(0, limit)

  const calculatorHrefs = new Set(item.relatedCalculators.map((link) => link.href))
  if (calculatorHrefs.size === 0) return []

  const sharedCalculator = candidates.filter((candidate) => candidate.relatedCalculators.some((link) => calculatorHrefs.has(link.href)))
  return sharedCalculator.slice(0, limit)
}
