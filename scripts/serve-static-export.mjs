// A minimal static file server for out/ (the STATIC_EXPORT=true build output), used only by
// scripts/run-e2e-analytics.mjs. Sprint 45 — see docs/DEPLOYMENT.md's "Running the existing
// Playwright suite against the static export" section, which documented this exact need (a Node
// equivalent of the Sprint 34 Python `http.server` verification, for CI portability) as a future
// follow-up before it existed.
//
// Deliberately real per-path 404 behavior — no SPA-style fallback to index.html for unmatched
// paths — because Sprint 34 found the `serve` npm package's fallback behavior to be a
// `serve`-specific quirk that masks real export-output problems (see docs/DEPLOYMENT.md). This
// replicates Apache's `mod_dir`/`DirectorySlash` behavior instead: a directory-shaped request
// (path with no extension, or an explicit trailing slash) serves that directory's `index.html`;
// everything else is looked up as an exact file.
import fs from "node:fs"
import http from "node:http"
import path from "node:path"

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

// Mirrors public/.htaccess's `ForceType image/png` block for Next's extensionless
// icon/apple-icon/opengraph-image route output — see docs/DEPLOYMENT.md.
const EXTENSIONLESS_PNG_NAMES = new Set(["icon", "apple-icon", "opengraph-image"])

function resolveFile(outDir, pathname) {
  const decoded = decodeURIComponent(pathname)
  const safeRelative = path.normalize(decoded).replace(/^([.][.][/\\])+/, "")
  const requested = path.join(outDir, safeRelative)

  if (requested.endsWith(path.sep) || decoded.endsWith("/")) {
    const indexPath = path.join(requested, "index.html")
    return fs.existsSync(indexPath) ? indexPath : null
  }
  if (fs.existsSync(requested) && fs.statSync(requested).isFile()) return requested
  if (fs.existsSync(requested) && fs.statSync(requested).isDirectory()) {
    const indexPath = path.join(requested, "index.html")
    return fs.existsSync(indexPath) ? indexPath : null
  }
  return null
}

export function createStaticExportServer(outDir) {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    const filePath = resolveFile(outDir, url.pathname)

    if (!filePath) {
      const notFoundPage = path.join(outDir, "404.html")
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      res.end(fs.existsSync(notFoundPage) ? fs.readFileSync(notFoundPage) : "Not found")
      return
    }

    const ext = path.extname(filePath)
    const baseName = path.basename(filePath)
    const contentType = EXTENSIONLESS_PNG_NAMES.has(baseName) ? "image/png" : (CONTENT_TYPES[ext] ?? "application/octet-stream")
    res.writeHead(200, { "Content-Type": contentType })
    res.end(fs.readFileSync(filePath))
  })
}
