import type { EditorialContentSummary } from "@/types/editorial-content"

export type BlogCategoryOption = { readonly slug: string; readonly name: string }

/** Unique categories represented across the given posts, in first-seen order. */
export function getBlogCategoryOptions(items: readonly EditorialContentSummary[]): readonly BlogCategoryOption[] {
  const seen = new Map<string, string>()
  for (const item of items) seen.set(item.category.slug, item.category.name)
  return Array.from(seen, ([slug, name]) => ({ slug, name }))
}

export function filterBlogPostsByCategory(items: readonly EditorialContentSummary[], categorySlug: string | null): readonly EditorialContentSummary[] {
  return categorySlug === null ? items : items.filter((item) => item.category.slug === categorySlug)
}

/**
 * Splits a page of posts into the single featured post and the remaining grid posts. A plain
 * destructure of one array (not two independent queries) so `rest` can never also contain
 * `featured` — guards against the featured post being duplicated into the grid below it.
 */
export function splitFeaturedPost(items: readonly EditorialContentSummary[]): { readonly featured: EditorialContentSummary | undefined; readonly rest: readonly EditorialContentSummary[] } {
  const [featured, ...rest] = items
  return { featured, rest }
}
