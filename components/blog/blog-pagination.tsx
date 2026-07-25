import { cn } from "@/lib/utils"

/**
 * Structurally complete but currently dormant: with only a handful of published posts,
 * totalPages is always 1 and this renders nothing. Kept as a real (not fake) component so
 * it is a clean drop-in once post volume crosses the pagination threshold. See
 * docs/DECISIONS.md for the deferral decision and threshold.
 */
export function BlogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  readonly currentPage: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Blog pagination" className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-ink-soft disabled:pointer-events-none disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
          className={cn(
            "size-8 rounded-full border text-sm font-semibold transition-colors",
            page === currentPage ? "border-ink bg-ink text-white" : "border-line bg-card text-muted-foreground hover:border-ink-soft",
          )}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-ink-soft disabled:pointer-events-none disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}
