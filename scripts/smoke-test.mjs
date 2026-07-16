// Post-deployment smoke test (Sprint 35). Exercises a running ThinkCalculator deployment over
// HTTP(S) and reports pass/fail/skip for each check. Usable two ways:
//
//   node scripts/smoke-test.mjs                              # checks https://thinkcalculator.in
//   node scripts/smoke-test.mjs https://thinkcalculator.in    # same, explicit
//   node scripts/smoke-test.mjs http://localhost:8080         # local static export (see below)
//   SMOKE_TEST_BASE_URL=https://thinkcalculator.in node scripts/smoke-test.mjs
//
// Local static-export testing: `npm run build:export` then serve out/ with a real static file
// server (e.g. `npx serve out` or `python -m http.server 8080` from inside out/) and point this
// script at that URL. Checks that depend on DNS, a real certificate, or Apache actually
// interpreting public/.htaccess (HTTPS-active, HTTP->HTTPS redirect, www/non-www redirect, and -
// on most plain static file servers, which don't read .htaccess at all - the security headers)
// SKIP or are expected to fail against localhost; this is normal and is called out in the summary,
// not a bug in the script. The sitemap/robots/title/404 checks are meaningful locally because
// sitemap.xml, robots.txt, and every page's canonical URLs are already absolute production URLs
// baked in at build time from lib/site-config.ts, regardless of what host actually serves them.
//
// CANONICAL_ORIGIN, CANONICAL_HOST, and EXPECTED_SECURITY_HEADERS are duplicated here (not
// imported) because this is a plain Node script with no TypeScript loader configured. Keep them in
// sync with lib/site-config.ts and lib/production-config.ts respectively.

const CANONICAL_ORIGIN = "https://thinkcalculator.in"
const CANONICAL_HOST = "thinkcalculator.in"
const WWW_HOST = `www.${CANONICAL_HOST}`

// Keep in sync with lib/production-config.ts's securityHeaders (Sprint 33 baseline).
const EXPECTED_SECURITY_HEADERS = [
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"],
  ["x-frame-options", "SAMEORIGIN"],
  ["cross-origin-opener-policy", "same-origin"],
  ["strict-transport-security", "max-age=31536000"],
]

// One representative route per content type (Sprint 34 used the same four for its local audit).
const SAMPLE_ROUTES = [
  { label: "calculator", path: "/finance/emi-calculator/", titleContains: "EMI Calculator: Calculate Loan EMI" },
  { label: "glossary term", path: "/glossary/emi/", titleContains: "EMI: Meaning and Examples" },
  { label: "blog post", path: "/blog/understanding-loan-emi/", titleContains: "Understanding Loan EMI: Principal, Interest, and Tenure" },
  { label: "topic hub", path: "/topics/loans/", titleContains: "Loans: EMI, Interest, and Repayment Guides" },
]

const FETCH_TIMEOUT_MS = 10_000

const rawBaseUrl = process.argv[2] || process.env.SMOKE_TEST_BASE_URL || CANONICAL_ORIGIN
const baseUrl = rawBaseUrl.replace(/\/+$/, "")
const baseHostname = new URL(baseUrl).hostname
const isLocalTarget = ["localhost", "127.0.0.1", "::1"].includes(baseHostname)

const results = []

function record(name, status, detail) {
  results.push({ name, status, detail })
}

async function fetchSafe(url, options = {}) {
  return fetch(url, { redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), ...options })
}

async function check(name, fn) {
  try {
    await fn()
  } catch (error) {
    record(name, "FAIL", error instanceof Error ? error.message : String(error))
  }
}

async function skip(name, reason) {
  record(name, "SKIP", reason)
}

async function followRedirects(url, maxHops = 5) {
  let current = url
  for (let hop = 0; hop < maxHops; hop += 1) {
    const response = await fetchSafe(current)
    if (response.status < 300 || response.status >= 400) return response
    const location = response.headers.get("location")
    if (!location) return response
    current = new URL(location, current).toString()
  }
  throw new Error(`Exceeded ${maxHops} redirect hops starting from ${url}`)
}

// 1. Homepage returns 200.
await check("Homepage returns 200", async () => {
  const response = await followRedirects(`${baseUrl}/`)
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
  record("Homepage returns 200", "PASS", `${response.status} from ${response.url || `${baseUrl}/`}`)
})

// 2. HTTPS is active (no cert errors).
if (!baseUrl.startsWith("https://")) {
  await skip("HTTPS is active", "Base URL is not https:// — run against the live https://thinkcalculator.in to verify this check.")
} else {
  await check("HTTPS is active", async () => {
    const response = await fetchSafe(`${baseUrl}/`)
    record("HTTPS is active", "PASS", `TLS handshake succeeded (status ${response.status})`)
  })
}

// 3. HTTP redirects to HTTPS.
if (isLocalTarget) {
  await skip("HTTP redirects to HTTPS", "Base URL targets localhost — this depends on public/.htaccess being interpreted by real Apache/LiteSpeed, which local static servers don't do. Verify against the live domain after deployment.")
} else {
  await check("HTTP redirects to HTTPS", async () => {
    const httpOrigin = new URL(baseUrl); httpOrigin.protocol = "http:"
    const response = await fetchSafe(`${httpOrigin.origin}/`)
    if (response.status < 300 || response.status >= 400) throw new Error(`Expected a 3xx redirect, got ${response.status}`)
    const location = response.headers.get("location") || ""
    if (!location.startsWith("https://")) throw new Error(`Expected redirect Location to start with https://, got "${location}"`)
    record("HTTP redirects to HTTPS", "PASS", `${response.status} -> ${location}`)
  })
}

// 4. Non-canonical host (www) redirects to canonical (non-www).
if (isLocalTarget) {
  await skip("www redirects to canonical host", "Base URL targets localhost — no alternate host to test. Verify against the live domain after deployment.")
} else {
  await check("www redirects to canonical host", async () => {
    const wwwOrigin = new URL(baseUrl); wwwOrigin.hostname = wwwOrigin.hostname === CANONICAL_HOST ? WWW_HOST : wwwOrigin.hostname
    const response = await fetchSafe(`${wwwOrigin.origin}/`)
    if (response.status < 300 || response.status >= 400) throw new Error(`Expected a 3xx redirect, got ${response.status}`)
    const location = response.headers.get("location") || ""
    if (!location.startsWith(CANONICAL_ORIGIN)) throw new Error(`Expected redirect Location to start with ${CANONICAL_ORIGIN}, got "${location}"`)
    record("www redirects to canonical host", "PASS", `${response.status} -> ${location}`)
  })
}

// 5. Security headers present, matching the Sprint 33/34 baseline exactly.
await check("Security headers match the configured set", async () => {
  const response = await fetchSafe(`${baseUrl}/`, { redirect: "follow" })
  const missing = []
  const mismatched = []
  for (const [key, expected] of EXPECTED_SECURITY_HEADERS) {
    const actual = response.headers.get(key)
    if (actual === null) missing.push(key)
    else if (actual !== expected) mismatched.push(`${key}: expected "${expected}", got "${actual}"`)
  }
  if (missing.length || mismatched.length) {
    const localNote = isLocalTarget ? " (expected on localhost unless served through a real Apache/LiteSpeed instance that reads public/.htaccess — most plain static file servers, e.g. `serve` or `python -m http.server`, ignore .htaccess entirely)" : ""
    throw new Error([missing.length ? `Missing: ${missing.join(", ")}` : null, mismatched.length ? `Mismatched: ${mismatched.join("; ")}` : null].filter(Boolean).join(" | ") + localNote)
  }
  record("Security headers match the configured set", "PASS", `All ${EXPECTED_SECURITY_HEADERS.length} headers present and matching`)
})

// 6. Custom 404 page is served for an unmatched route.
await check("Custom 404 page served for unmatched route", async () => {
  const response = await followRedirects(`${baseUrl}/smoke-test-nonexistent-route-${Date.now()}/`)
  if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`)
  const body = await response.text()
  if (!body.includes("Page not found")) {
    const localNote = isLocalTarget ? " (expected on localhost unless served through a real Apache/LiteSpeed instance that honours the .htaccess ErrorDocument directive — most plain static file servers, e.g. `serve` or `python -m http.server`, serve their own generic 404 page instead of out/404.html)" : ""
    throw new Error(`404 response body did not contain the custom not-found page's "Page not found" text — a generic host error page may be served instead of out/404.html${localNote}`)
  }
  record("Custom 404 page served for unmatched route", "PASS", "404 status with custom page content confirmed")
})

// 7. sitemap.xml is reachable and references the correct canonical host.
await check("sitemap.xml reachable and correctly hosted", async () => {
  const response = await followRedirects(`${baseUrl}/sitemap.xml`)
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
  const body = await response.text()
  const locMatches = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  if (locMatches.length === 0) throw new Error("sitemap.xml contained no <loc> entries")
  const wrongHost = locMatches.find((url) => !url.startsWith(CANONICAL_ORIGIN))
  if (wrongHost) throw new Error(`Found a sitemap URL not on the canonical host: ${wrongHost}`)
  record("sitemap.xml reachable and correctly hosted", "PASS", `${locMatches.length} URLs, all on ${CANONICAL_ORIGIN}`)
})

// 8. robots.txt is reachable and references the correct canonical host.
await check("robots.txt reachable and correctly hosted", async () => {
  const response = await followRedirects(`${baseUrl}/robots.txt`)
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
  const body = await response.text()
  if (!body.includes(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`)) throw new Error(`robots.txt did not reference "Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml"`)
  if (!body.includes(`Host: ${CANONICAL_HOST}`)) throw new Error(`robots.txt did not reference "Host: ${CANONICAL_HOST}"`)
  record("robots.txt reachable and correctly hosted", "PASS", "Sitemap and Host directives reference the canonical domain")
})

// 9. A sample route from each content type returns 200 with the correct page-specific title.
for (const route of SAMPLE_ROUTES) {
  await check(`Route returns 200 with correct title: ${route.label} (${route.path})`, async () => {
    const response = await followRedirects(`${baseUrl}${route.path}`)
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
    const body = await response.text()
    const titleMatch = body.match(/<title>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : ""
    if (!title.includes(route.titleContains)) throw new Error(`Expected <title> to contain "${route.titleContains}", got "${title}"`)
    record(`Route returns 200 with correct title: ${route.label} (${route.path})`, "PASS", `<title>${title}</title>`)
  })
}

const statusLabel = { PASS: "PASS", FAIL: "FAIL", SKIP: "SKIP" }
const widest = Math.max(...results.map((result) => result.name.length))

console.log(`\nThinkCalculator smoke test — target: ${baseUrl}\n`)
for (const result of results) {
  console.log(`[${statusLabel[result.status]}] ${result.name.padEnd(widest)}  ${result.detail}`)
}

const failures = results.filter((result) => result.status === "FAIL")
const skipped = results.filter((result) => result.status === "SKIP")
const passed = results.filter((result) => result.status === "PASS")

console.log(`\n${passed.length} passed, ${failures.length} failed, ${skipped.length} skipped.`)
if (isLocalTarget) {
  console.log("Target is localhost: DNS/SSL/redirect-specific checks were skipped and the security-header check may legitimately fail unless served through real Apache/LiteSpeed. Re-run against https://thinkcalculator.in after deployment for a meaningful end-to-end result.")
}

process.exit(failures.length > 0 ? 1 : 0)
