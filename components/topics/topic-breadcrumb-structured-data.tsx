import { createCanonicalUrl } from "@/lib/seo"

export function TopicBreadcrumbStructuredData({ topicName, topicPath }: { readonly topicName?: string; readonly topicPath?: string }) {
  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Home", item: createCanonicalUrl("/") },
    { "@type": "ListItem", position: 2, name: "Topics", item: createCanonicalUrl("/topics") },
    ...(topicName && topicPath ? [{ "@type": "ListItem", position: 3, name: topicName, item: createCanonicalUrl(topicPath) }] : []),
  ]
  const data = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
