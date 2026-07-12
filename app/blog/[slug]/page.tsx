import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EditorialLayout } from "@/components/editorial/editorial-layout"
import { EditorialStructuredData } from "@/components/editorial/editorial-structured-data"
import { getContentBySlug, getEditorialStaticParams, contentRegistry } from "@/features/content"
import { createEditorialMetadata } from "@/lib/seo"
type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = false
export function generateStaticParams() { return getEditorialStaticParams("blog", contentRegistry) }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = getContentBySlug((await params).slug, "blog"); return item && item.status === "published" ? createEditorialMetadata(item) : {} }
export default async function BlogArticlePage({ params }: Props) { const item = getContentBySlug((await params).slug, "blog"); if (!item || item.status !== "published") notFound(); return <><EditorialStructuredData item={item} /><EditorialLayout item={item} /></> }
