import type { EditorialCallout as Callout } from "@/types/editorial-content"
export function EditorialCallout({ callout }: { readonly callout: Callout }) { return <aside className="rounded-xl border-l-4 border-primary bg-muted/40 p-5"><p className="font-semibold">{callout.title}</p><p className="mt-2 leading-7 text-muted-foreground">{callout.text}</p></aside> }
