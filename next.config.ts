import type { NextConfig } from "next";
import { securityHeaders } from "./lib/production-config";

// Hostinger shared hosting has no Node.js process — it serves plain files via Apache/LiteSpeed.
// STATIC_EXPORT=true switches `next build` to static-export mode (see scripts/build-export.mjs /
// `npm run build:export`), producing the out/ directory uploaded to Hostinger. It is opt-in
// rather than always-on so `next dev`, `next start`, and the Playwright suite (which starts a
// real Next server) keep working unchanged for local development and CI.
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
        // Emits `/finance/emi-calculator/index.html` instead of `/finance/emi-calculator.html`,
        // so clean URLs without a `.html` extension resolve correctly on Apache's default
        // directory-index/DirectorySlash behavior with no .htaccess rewrite rules needed. See
        // docs/DEPLOYMENT.md ("Trailing slash / clean URLs") for the full reasoning.
        trailingSlash: true,
      }
    : {}),
  // headers() only takes effect while a Next.js server process is handling requests. Hostinger's
  // static hosting serves out/ directly from Apache/LiteSpeed, which never runs this function, so
  // it is a no-op in production today — public/.htaccess is the real enforcement mechanism there
  // (see docs/DEPLOYMENT.md). This is left in place, unused but harmless, so the same headers
  // still apply automatically if the app is ever hosted on a Node runtime again.
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }]
  },
};

export default nextConfig;
