"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { ArrowRight, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resourceLinks, ResourceDirectory } from "@/components/search/resource-directory"
import {
  createEditorialSearchHref,
  EDITORIAL_SEARCH_QUERY_MAX_LENGTH,
  getEditorialSearchQuery,
  normalizeEditorialSearchQuery,
  searchEditorialDocuments,
} from "@/features/content/editorial-search-query"
import type { EditorialSearchDocument, EditorialSearchResultType } from "@/types/editorial-search"

const typeLabels: Record<EditorialSearchResultType, string> = {
  blog: "Blog",
  guide: "Guide",
  glossary: "Glossary term",
  topic: "Topic hub",
}

function ResourceSearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const href = createEditorialSearchHref(query)
    setQuery(normalizeEditorialSearchQuery(query))
    router.push(href)
  }

  return (
    <form action="/search" method="get" role="search" className="rounded-xl border bg-card p-4 sm:p-6" onSubmit={handleSubmit}>
      <label htmlFor="resource-search-query" className="font-medium">Search learning resources</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="resource-search-query"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={EDITORIAL_SEARCH_QUERY_MAX_LENGTH}
            autoComplete="off"
            spellCheck="true"
            placeholder="Try EMI, compounding, loans…"
            className="h-11 pl-10"
          />
        </div>
        <Button type="submit" className="sm:self-stretch">Search resources</Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Searches published blogs, guides, glossary terms, and public topic hubs. Calculators have their own search.</p>
    </form>
  )
}

export function ResourceSearch({ documents }: { documents: readonly EditorialSearchDocument[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawQuery = searchParams.get("q") ?? ""
  const query = getEditorialSearchQuery(searchParams)
  const normalizedHref = createEditorialSearchHref(rawQuery)
  const currentSearch = searchParams.toString()
  const currentHref = currentSearch ? `/search?${currentSearch}` : "/search"
  const search = searchEditorialDocuments(documents, rawQuery)

  useEffect(() => {
    if (currentHref !== normalizedHref) router.replace(normalizedHref, { scroll: false })
  }, [currentHref, normalizedHref, router])

  return (
    <div className="mt-10">
      <ResourceSearchForm key={query} initialQuery={query} />

      {search.truncated ? <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">Only the first {EDITORIAL_SEARCH_QUERY_MAX_LENGTH} characters were searched.</p> : null}

      {!search.query ? <ResourceDirectory /> : (
        <section className="mt-10" aria-labelledby="search-results-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="search-results-heading" className="text-2xl font-semibold tracking-tight">Results for “{search.query}”</h2>
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{search.results.length} {search.results.length === 1 ? "resource" : "resources"} found</p>
          </div>
          {search.results.length ? (
            <ul className="mt-5 space-y-4">
              {search.results.map((result) => (
                <li key={result.id}>
                  <article className="rounded-xl border bg-card p-5 sm:p-6">
                    <p className="text-sm font-semibold text-primary">{typeLabels[result.type]}{result.context ? ` · ${result.context}` : ""}</p>
                    <h3 className="mt-2 text-xl font-semibold"><Link href={result.canonicalPath} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{result.title}</Link></h3>
                    <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{result.description}</p>
                    <Link href={result.canonicalPath} className="mt-4 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open {typeLabels[result.type].toLocaleLowerCase("en-IN")}<ArrowRight className="size-4" aria-hidden="true" /></Link>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-xl border bg-muted/30 p-6">
              <p className="font-medium">No published learning resources match this query.</p>
              <p className="mt-2 text-muted-foreground">Try a shorter term such as EMI, SIP, loan, interest, or compounding, or browse a resource collection below.</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{resourceLinks.map((resource) => <Link key={resource.href} href={resource.href} className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{resource.title}</Link>)}</div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
