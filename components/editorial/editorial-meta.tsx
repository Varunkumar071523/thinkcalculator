import type { EditorialContentItem } from "@/types/editorial-content"

const formatDate = (date: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
export function EditorialMeta({ item }: { readonly item: EditorialContentItem }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>By {item.author.name}</span><time dateTime={item.publishedAt}>Published {formatDate(item.publishedAt)}</time>{item.updatedAt ? <time dateTime={item.updatedAt}>Updated {formatDate(item.updatedAt)}</time> : null}<span>{item.estimatedReadingMinutes} min read</span></div>
}
