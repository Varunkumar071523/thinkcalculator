import type { EditorialContentItem, EditorialTableOfContentsItem } from "@/types/editorial-content"

export function getTableOfContents(item: EditorialContentItem): readonly EditorialTableOfContentsItem[] {
  return item.sections.map((section) => ({ id: section.id, title: section.title, children: section.subsections?.map((child) => ({ id: child.id, title: child.title })) }))
}
export function getEditorialStaticParams(type: "blog" | "guide", items: readonly EditorialContentItem[]) {
  return items.filter((item) => item.status === "published" && item.type === type).map((item) => ({ slug: item.slug }))
}
