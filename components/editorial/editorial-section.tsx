import Link from "next/link"
import type { EditorialSection as Section } from "@/types/editorial-content"
import { EditorialCallout } from "./editorial-callout"
import { EditorialTable } from "./editorial-table"

export function EditorialSection({ section, nested = false }: { readonly section: Section; readonly nested?: boolean }) {
  const Heading = nested ? "h3" : "h2"
  return <section id={section.id} className="scroll-mt-24"><Heading className={nested ? "text-xl font-semibold" : "text-2xl font-semibold tracking-tight"}>{section.title}</Heading><div className="mt-4 space-y-5">{section.blocks.map((block, index) => {
    if (block.type === "paragraph") return <div key={index} className="space-y-3"><p className="leading-7 text-muted-foreground">{block.text}</p>{block.links?.length ? <p className="flex flex-wrap gap-x-4 gap-y-2">{block.links.map((link) => link.external ? <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">{link.text}</a> : <Link key={link.href} href={link.href} className="font-medium text-primary underline-offset-4 hover:underline">{link.text}</Link>)}</p> : null}</div>
    if (block.type === "list") { const List = block.ordered ? "ol" : "ul"; return <List key={index} className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 leading-7 text-muted-foreground`}>{block.items.map((item) => <li key={item}>{item}</li>)}</List> }
    if (block.type === "callout") return <EditorialCallout key={index} callout={block} />
    return <EditorialTable key={index} table={block} />
  })}{section.subsections?.map((child) => <EditorialSection key={child.id} section={child} nested />)}</div></section>
}
