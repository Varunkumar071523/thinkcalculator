# Contributing to ThinkCalculator

## Prerequisites and setup

Use a current Node.js LTS release, npm, Git, and a browser.

```bash
git clone <repository-url>
cd thinkcalculator
npm install
npm run dev
```

Review [PROJECT.md](../PROJECT.md), [ARCHITECTURE.md](ARCHITECTURE.md), relevant Next.js 16 docs in `node_modules/next/dist/docs/`, and the nearest established feature before editing.

## Branch workflow

Create a short-lived branch from the current integration branch. Use `feature/`, `fix/`, or `docs/`, for example:

- `feature/sip-calculator`
- `feature/seo-foundation`
- `docs/project-documentation`
- `fix/emi-rounding`

Keep the branch focused, preserve unrelated working-tree changes, sync before review, and do not rewrite shared history.

## Commits and pull requests

Use concise conventional messages, such as:

- `feat: add SIP calculator`
- `fix: correct FD maturity rounding`
- `docs: add architecture documentation`
- `test: add calculator validation coverage`

A pull request should state the user-facing outcome, assumptions, routes/files affected, test evidence, screenshots for meaningful visual changes, SEO/accessibility impact, limitations, and follow-up work. Keep generated noise and unrelated refactors out.

## Required validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Also inspect affected routes, invalid states, mobile layout, keyboard navigation, metadata, and console/server errors. A clean build may need network access for Geist fonts.

## TypeScript rules

- Use explicit calculator input/result and content types.
- Avoid `any` unless unavoidable and documented.
- Prefer readonly data and pure functions.
- Return structured values; format currency, percentages, and dates in presentation code.

## Component rules

- Use Server Components by default and add `"use client"` only for browser state/events.
- Give components one clear responsibility and compose shared primitives.
- Keep calculator-specific logic out of generic UI components.
- Use Tailwind tokens and existing shadcn Base/Nova patterns; avoid broad redesigns and unnecessary animation.

## Calculator rules

- Separate typed validation from pure calculation and schedule functions.
- Never read browser state, render UI, format strings, call a network, or mutate input inside a calculation.
- Add definition, route, registry entry, formula/method, example, FAQs, relations, metadata, knowledge content, and tests.
- Validate query state and keep canonical URLs query-free.
- Cross-check examples against the implementation.

## Content rules

Follow [CONTENT-GUIDE.md](CONTENT-GUIDE.md). Use structured version-controlled content, real dates, factual author data, live links, disclaimers, and primary official sources for regulatory claims. Drafts must remain excluded publicly.

## SEO rules

Every indexable page needs a unique title/description, canonical, H1, logical headings, internal links, and breadcrumbs where appropriate. Structured data must reflect visible facts. Do not add SearchAction without a stable public search route.

## Testing requirements

Add focused tests for new behaviour, boundary conditions, registry invariants, URLs, and draft exclusions. Avoid snapshots. Fix regressions rather than weakening assertions. Manual browser checks complement but do not replace unit tests.

Running a single Playwright spec ad hoc? Use `scripts/run-e2e.mjs` (e.g. `node scripts/run-e2e.mjs tests/e2e/some.spec.ts`), not a bare `npx playwright test ...`, and never pipe Playwright's own CLI through `tail`/`grep`. Piping buffers all output until the process exits, so a genuine hang and a slow-but-working run look identical — indistinguishable from the outside until you kill it and try again. `scripts/run-e2e.mjs` streams output directly and also works around the Windows `next start` teardown hang (see the comment at the top of that file).

## Accessibility requirements

Use semantic HTML, accessible names, keyboard operation, visible focus, logical headings, status/error communication, meaningful time elements, captioned/headered tables, and text equivalents for visual data. Check mobile reflow, contrast, zoom, and page-level overflow.

## Do not

- Install dependencies, add infrastructure, or expand scope without justification and review.
- Put executable formulas in content or a database.
- Introduce secrets, fake facts, credentials, citations, rates, thresholds, guarantees, or personalised advice.
- Add a database, CMS, API, authentication, service worker, strict CSP, PDF dependency, or chart dependency casually.
- Commit generated build output, bypass validation, or mix unrelated changes.

## Merge and cleanup

Resolve review feedback, rerun validation on the final diff, confirm documentation and internal links, and use the repository’s reviewed merge process. After merge, delete the feature branch when safe, update local branches without destructive resets, and record meaningful user-facing changes in [CHANGELOG.md](CHANGELOG.md).
