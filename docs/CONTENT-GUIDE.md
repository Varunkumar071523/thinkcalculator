# ThinkCalculator Editorial Handbook

This guide applies to calculator knowledge content, blogs, guides, and the planned glossary. Editorial entries are typed and version-controlled; implementation details are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Principles, audience, and tone

- Help Indian readers understand calculations, assumptions, trade-offs, and limitations.
- Write in clear, calm, educational language; define technical terms before using them heavily.
- Prefer useful examples and visible assumptions over promotional language.
- Do not give personalised financial, tax, legal, medical, or investment advice.
- Avoid keyword stuffing and arbitrary word-count targets.

## Accuracy rules

- Cross-check worked examples against the production calculation function.
- Distinguish calculated estimates from actual provider outcomes.
- Verify internal links and use meaningful link text.
- Never fabricate citations, references, author details, evidence, publication dates, or update dates.
- Use primary official sources for regulatory claims and record the rule’s jurisdiction and effective date in the content or review notes.

## Financial disclaimers

Content discussing estimates must state that results are educational scenarios, not advice or an offer. Investment content must say returns are not guaranteed and may vary or be negative. Loan/deposit content must note that fees, taxes, payment timing, rounding, rate changes, and provider rules may differ. A disclaimer does not excuse an inaccurate claim.

## Calculator-page content

Every production calculator needs a unique title/description, input explanations, method or formula, assumptions, implementation-checked example, useful FAQs, related calculators, relevant learning links, and a factual disclaimer. Do not duplicate a full blog or guide merely to make a page longer.

## Blogs

Blogs explain a concept or comparison. Use four to seven coherent structured sections where the subject warrants them, a practical example, a callout or table when useful, relevant calculators, related published content, and only genuinely useful FAQs.

## Guides

Guides help a reader perform or interpret a task. Use an ordered flow, explain inputs and outputs, identify common mistakes and limits, link directly to the relevant production tool, and prefer Article structured data unless the visible content fully supports HowTo.

## Glossary

The Glossary Engine is planned, not implemented. A future term should have a plain-language definition, relevant context, calculation relationship where applicable, examples, live calculator/editorial links, and unique metadata. Do not publish thin synonym pages or fabricate authority signals.

## Internal links

- Link only to live routes and published editorial content; never use `href="#"`.
- Use `next/link` for internal application links and safe `rel` attributes for external links.
- Prefer contextual, meaningful text over repeated exact-match phrases.
- Do not expose category or tag links until stable non-empty routes exist.
- Drafts must remain outside public lists, relations, static params, and sitemap.

## Metadata and structured data

- Titles, descriptions, canonicals, and metadata titles must be unique and accurate.
- Canonicals use the production origin and stable clean path.
- Use BlogPosting for blogs and Article for general guides; use FAQPage only for visible, useful FAQs.
- Include only factual headline, description, URL, dates, author name, publisher, and main page fields.
- Never add ratings, review counts, fake images, fake credentials, or a SearchAction without a stable search route.

## FAQ rules

FAQs must answer likely user questions not already resolved clearly in the section body. Keep questions unique within an item, answers concise and qualified, and visible FAQ text aligned with structured data. Do not create FAQs merely for search coverage.

## Authors and dates

The current factual author is “ThinkCalculator Editorial Team” with the description “Educational content prepared for ThinkCalculator.” Do not invent qualifications, certifications, photographs, biographies, or profiles. Use a genuine version-controlled publication date and add `updatedAt` only after a meaningful reviewed change; never refresh dates cosmetically.

## Tax, regulatory, and current-rate content

- Use primary official sources, such as the relevant government department, regulator, or statutory publication.
- State the applicable period and review time-sensitive content before publication.
- Never invent current tax thresholds, slabs, exemptions, regulatory rules, lender rates, bank rates, or expected market returns.
- Avoid provider-specific claims unless directly supported and necessary; do not imply a rate is current without fresh verification.

## Prohibited claims

Never promise guaranteed returns, guaranteed approval, exact provider outcomes, risk-free market investments, tax savings without conditions, or professional endorsement. Never keyword-stuff, conceal material assumptions, or imply that an estimate is personalised advice.

## AI-assisted drafting workflow

1. Give the drafting tool the current content types, calculator implementation, and this handbook.
2. Require it to identify claims needing official verification rather than inventing sources.
3. Cross-check formulas and examples against production code and tests.
4. Have a human review facts, tone, links, metadata, dates, disclaimers, and unsupported claims.
5. Keep status `draft` until review and automated validation pass.
6. Publish through a reviewed source-control change and verify the generated route and sitemap.

AI output is a draft, not evidence. A plausible statement without a verified source must be omitted or qualified.

## Add an editorial item

1. Choose `blog` or `guide` and a unique route under `/blog/[slug]` or `/guides/[slug]`.
2. Reuse the author, category, and tag definitions in `features/content/content-types.ts`.
3. Add the typed item to `features/content/content-registry.ts` with unique IDs, canonical path, metadata title, and section IDs.
4. Use paragraphs, ordered/unordered lists, callouts, and semantic tables rather than HTML strings.
5. Add related production calculators and only published related editorial paths.
6. Calculate/check reading time, FAQs, disclaimer, and genuine dates.
7. Keep the item draft through editorial review, then change status in the reviewed publication change.

## Review checklist

- [ ] Audience need, title, and scope are clear.
- [ ] Claims, calculations, examples, and primary official references are verified.
- [ ] Assumptions and limitations are visible.
- [ ] No invented rates, thresholds, credentials, citations, or guarantees appear.
- [ ] Metadata, canonical, publication status, and dates are accurate.
- [ ] Headings, lists, callouts, tables, FAQs, and disclaimers are useful and accessible.
- [ ] All calculator and editorial links resolve to live published routes.
- [ ] Draft exclusion and structured data are correct.
- [ ] Mobile table overflow, keyboard focus, and heading order are checked.

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
