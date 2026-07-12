import type { MetadataRoute } from "next"

import { webManifest } from "@/lib/production-config"

export default function manifest(): MetadataRoute.Manifest {
  return webManifest
}
