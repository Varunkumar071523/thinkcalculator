import type { MetadataRoute } from "next"

import { createCanonicalUrl } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: createCanonicalUrl("/sitemap.xml"),
    host: new URL(siteConfig.url).host,
  }
}
