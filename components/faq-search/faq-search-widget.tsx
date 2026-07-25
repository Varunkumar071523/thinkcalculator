"use client"

import { Dialog } from "@base-ui/react/dialog"
import { ChevronDown, MessageCircleQuestion, Search, X } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createFaqSearchEngine,
  FAQ_SEARCH_QUERY_MAX_LENGTH,
  getFaqSearchResults,
  isFaqSearchQueryTooShort,
} from "@/features/faq-search/faq-search-query"
import { cn } from "@/lib/utils"
import type { FaqSearchDocument } from "@/types/faq-search"

const resultActionLabel: Record<FaqSearchDocument["kind"], string> = {
  faq: "Open calculator",
  example: "Open worked example",
  guide: "Read full section",
}

function FaqSearchResultItem({
  document,
  expanded,
  onToggle,
}: {
  readonly document: FaqSearchDocument
  readonly expanded: boolean
  readonly onToggle: () => void
}) {
  const bodyId = `faq-search-result-${document.id}`

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-start justify-between gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{document.question}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{document.source}</span>
        </span>
        <ChevronDown
          className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div id={bodyId} className="border-t px-3 pt-3 pb-3 text-sm">
          <p className="leading-6 text-muted-foreground">{document.body}</p>
          <Link
            href={document.href}
            className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {resultActionLabel[document.kind]} →
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export function FaqSearchWidget({ documents }: { readonly documents: readonly FaqSearchDocument[] }) {
  const [query, setQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const engine = useMemo(() => createFaqSearchEngine(documents), [documents])

  const isSearching = !isFaqSearchQueryTooShort(query)
  const results = getFaqSearchResults(documents, engine, query)
  const showNoMatch = isSearching && results.length === 0

  function handleOpenChange(open: boolean) {
    if (!open) {
      setQuery("")
      setExpandedId(null)
    }
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        data-print-hide
        render={
          <Button
            variant="default"
            className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] size-14 rounded-full shadow-lg sm:right-6"
            aria-label="Ask a question about ThinkCalculator"
          />
        }
      >
        <MessageCircleQuestion className="size-6" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          data-print-hide
          className="fixed inset-0 z-[60] bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
        <Dialog.Popup
          data-slot="faq-search-panel"
          data-print-hide
          className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl transition duration-150 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-starting-style:translate-y-2 sm:right-6"
        >
          <div className="flex items-center justify-between gap-2 border-b p-4">
            <Dialog.Title className="font-serif text-lg font-semibold">Ask ThinkCalculator</Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={FAQ_SEARCH_QUERY_MAX_LENGTH}
                placeholder="Ask about EMI, SIP, PPF…"
                aria-label="Search calculator FAQs, worked examples, and guides"
                className="h-10 pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!isSearching ? (
              <p className="px-1 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Popular questions</p>
            ) : null}
            {showNoMatch ? (
              <div className="rounded-lg border border-dashed p-4 text-sm" role="status">
                <p className="font-medium">No matching answers yet.</p>
                <p className="mt-1 text-muted-foreground">Browse the full calculator list to find the right tool.</p>
                <Link
                  href="/calculators"
                  className="mt-3 inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Browse all calculators →
                </Link>
              </div>
            ) : (
              <>
                {isSearching ? (
                  <p className="px-1 pb-2 text-xs text-muted-foreground" role="status" aria-live="polite">
                    {results.length} {results.length === 1 ? "result" : "results"} found
                  </p>
                ) : null}
                <ul className="space-y-2">
                  {results.map((document) => (
                    <li key={document.id}>
                      <FaqSearchResultItem
                        document={document}
                        expanded={expandedId === document.id}
                        onToggle={() => setExpandedId((current) => (current === document.id ? null : document.id))}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
