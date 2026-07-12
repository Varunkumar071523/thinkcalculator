import type { Metadata } from "next"

import { siteConfig } from "@/lib/site-config"
import type { CalculatorDefinition } from "@/types/calculator"

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

export function createOpenGraph({ title, description, path }: Pick<PageMetadataOptions, "title" | "description" | "path">): NonNullable<Metadata["openGraph"]> {
  return { type: "website", locale: "en_IN", url: createCanonicalUrl(path), siteName: siteConfig.name, title, description }
}

export function createPageMetadata({ title, description, path, keywords, noIndex = false }: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: { canonical: createCanonicalUrl(path) },
    openGraph: createOpenGraph({ title, description, path }),
    twitter: { card: "summary", title, description },
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
