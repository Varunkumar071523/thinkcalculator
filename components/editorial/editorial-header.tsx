import { Badge } from "@/components/ui/badge"
import type { EditorialContentItem } from "@/types/editorial-content"
import { EditorialMeta } from "./editorial-meta"

export function EditorialHeader({ item }: { readonly item: EditorialContentItem }) {
  return <header><div className="flex flex-wrap gap-2"><Badge variant="secondary">{item.category.name}</Badge>{item.tags.map((tag) => <Badge key={tag.slug} variant="outline">{tag.name}</Badge>)}</div><h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{item.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{item.excerpt}</p><div className="mt-5"><EditorialMeta item={item} /></div></header>
}
