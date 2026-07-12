import type { EditorialContentItem, EditorialSection } from "@/types/editorial-content"

function sectionText(section: EditorialSection): string {
  const blockText = section.blocks.flatMap((block) => block.type === "table" ? [block.caption, ...block.headers, ...block.rows.flat()] : block.type === "list" ? block.items : block.type === "callout" ? [block.title, block.text] : [block.text])
  return [section.title, ...blockText, ...(section.subsections ?? []).map(sectionText)].join(" ")
}
export function calculateReadingTime(item: Pick<EditorialContentItem, "title" | "excerpt" | "sections" | "faqs">): number {
  const text = [item.title, item.excerpt, ...item.sections.map(sectionText), ...item.faqs.flatMap((faq) => [faq.question, faq.answer])].join(" ")
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200))
}
