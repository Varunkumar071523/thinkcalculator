import type { MetadataRoute } from "next"

import { createCanonicalUrl } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: createCanonicalUrl("/sitemap.xml"),
    host: siteConfig.url,
  }
}
