"use client"

import { useMemo, useState } from "react"

import { filterBlogPostsByCategory, getBlogCategoryOptions, splitFeaturedPost } from "@/features/content"
import type { EditorialContentSummary } from "@/types/editorial-content"
import { BlogCategoryFilter } from "./blog-category-filter"
import { BlogFeaturedPost } from "./blog-featured-post"
import { BlogPagination } from "./blog-pagination"
import { BlogPostCard } from "./blog-post-card"

// Deferred until post volume warrants pagination; see docs/DECISIONS.md.
const POSTS_PER_PAGE = 12

export function BlogListing({ items }: { readonly items: readonly EditorialContentSummary[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const categories = useMemo(() => getBlogCategoryOptions(items), [items])
  const filteredItems = useMemo(() => filterBlogPostsByCategory(items, selectedCategory), [items, selectedCategory])
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / POSTS_PER_PAGE))
  const pageItems = filteredItems.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
  const { featured, rest } = splitFeaturedPost(pageItems)

  function handleCategoryChange(slug: string | null) {
    setSelectedCategory(slug)
    setPage(1)
  }

  if (items.length === 0) {
    return <p className="rounded-xl border border-line bg-card p-6 text-muted-foreground">No published blog articles are available yet.</p>
  }

  return (
    <div>
      {categories.length > 1 ? <BlogCategoryFilter categories={categories} selected={selectedCategory} onChange={handleCategoryChange} /> : null}

      {!featured ? (
        <p className={categories.length > 1 ? "mt-6 rounded-xl border border-line bg-card p-6 text-muted-foreground" : "rounded-xl border border-line bg-card p-6 text-muted-foreground"}>
          No posts match this category yet.
        </p>
      ) : (
        <>
          <div className={categories.length > 1 ? "mt-6" : ""}>
            <BlogFeaturedPost item={featured} />
            {rest.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {rest.map((item) => (
                  <BlogPostCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </div>
          <BlogPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
