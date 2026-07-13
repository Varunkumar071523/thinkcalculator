import type { Metadata } from "next"

import { siteConfig } from "@/lib/site-config"
import type { CalculatorDefinition } from "@/types/calculator"
import type { EditorialContentItem } from "@/types/editorial-content"

const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ThinkCalculator — Calculate. Compare. Decide. Financial calculators for India.",
} as const

type PageMetadataOptions = {
  title: string
  description: string
  path: string
  keywords?: readonly string[]
  noIndex?: boolean
}

export function createCanonicalUrl(path = "/"): string {
  return new URL(path, `${siteConfig.url}/`).toString()
}

export function createRootStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: siteConfig.name, url: siteConfig.url },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: "en-IN",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/search?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }
}

export function createOpenGraph({ title, description, path }: Pick<PageMetadataOptions, "title" | "description" | "path">): NonNullable<Metadata["openGraph"]> {
  return { type: "website", locale: "en_IN", url: createCanonicalUrl(path), siteName: siteConfig.name, title, description, images: [socialImage] }
}

export function createPageMetadata({ title, description, path, keywords, noIndex = false }: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: { canonical: createCanonicalUrl(path) },
    openGraph: createOpenGraph({ title, description, path }),
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
    robots: { index: !noIndex, follow: true },
  }
}

export function createCalculatorMetadata(calculator: CalculatorDefinition): Metadata {
  return createPageMetadata({
    title: calculator.metadata.title,
    description: calculator.metadata.description,
    path: calculator.canonicalPath,
    keywords: calculator.metadata.keywords,
    noIndex: calculator.status !== "published",
  })
}

export function createEditorialMetadata(item: EditorialContentItem): Metadata {
  return createPageMetadata({ title: item.metadata.title, description: item.metadata.description, path: item.canonicalPath, keywords: item.metadata.keywords, noIndex: item.status !== "published" })
}
