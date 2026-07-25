import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { getRelatedBlogPosts } from "@/features/content"
import { formatIsoDate } from "@/lib/formatters"
import type { EditorialContentItem } from "@/types/editorial-content"

/**
 * Blog-only, derived "related posts": same category first, shared linked-calculator as a
 * fallback. Deliberately separate from the manually-authored `relatedContent` shown inside
 * EditorialLayout/ClusterNavigation, and rendered only on the blog detail route so guides
 * (which share EditorialLayout) are untouched.
 */
export function RelatedBlogPosts({ item }: { readonly item: EditorialContentItem }) {
  const related = getRelatedBlogPosts(item)
  if (related.length === 0) return null

  return (
    <SiteContainer className="pb-10 sm:pb-14">
      <section aria-labelledby="related-posts-heading" className="mx-auto max-w-4xl border-t border-line pt-8">
        <h2 id="related-posts-heading" className="font-serif text-2xl font-semibold tracking-tight">
          Related reading
        </h2>
        <div className={`mt-4 grid gap-4 ${related.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {related.map((post) => (
            <Link
              key={post.id}
              href={post.canonicalPath}
              className="group rounded-xl border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-[11px] font-semibold tracking-wide text-money uppercase">{post.category.name}</p>
              <h3 className="mt-2 text-base font-semibold group-hover:underline">{post.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.45] text-muted-foreground">{post.description}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {formatIsoDate(post.publishedAt)} · {post.estimatedReadingMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </section>
    </SiteContainer>
  )
}
