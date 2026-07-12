import { createCanonicalUrl } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"
import type { EditorialContentItem } from "@/types/editorial-content"
export function EditorialStructuredData({ item }: { readonly item: EditorialContentItem }) {
  const article = { "@context": "https://schema.org", "@type": item.type === "blog" ? "BlogPosting" : "Article", headline: item.title, description: item.description, url: createCanonicalUrl(item.canonicalPath), datePublished: item.publishedAt, ...(item.updatedAt ? { dateModified: item.updatedAt } : {}), author: { "@type": "Organization", name: item.author.name }, publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, mainEntityOfPage: { "@type": "WebPage", "@id": createCanonicalUrl(item.canonicalPath) }, inLanguage: "en-IN" }
  const faq = item.faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: item.faqs.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) } : null
  return <>{[article, faq].filter(Boolean).map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />)}</>
}
