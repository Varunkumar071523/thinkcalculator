import type { EditorialContentItem } from "@/types/editorial-content"
import { EditorialCard } from "./editorial-card"
export function EditorialListing({ items, emptyMessage }: { readonly items: readonly EditorialContentItem[]; readonly emptyMessage: string }) { return items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((item) => <EditorialCard key={item.id} item={item} />)}</div> : <p className="rounded-xl border p-6 text-muted-foreground">{emptyMessage}</p> }
