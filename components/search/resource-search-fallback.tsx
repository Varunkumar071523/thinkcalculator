import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResourceDirectory } from "@/components/search/resource-directory"

export function ResourceSearchFallback() {
  return (
    <div className="mt-10">
      <form action="/search" method="get" role="search" className="rounded-xl border bg-card p-4 sm:p-6">
        <label htmlFor="resource-search-fallback-query" className="font-medium">Search learning resources</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Input id="resource-search-fallback-query" name="q" type="search" maxLength={120} autoComplete="off" spellCheck="true" placeholder="Try EMI, compounding, loans…" className="h-11 sm:flex-1" />
          <Button type="submit">Search resources</Button>
        </div>
      </form>
      <ResourceDirectory />
    </div>
  )
}
