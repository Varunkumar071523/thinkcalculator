# Editorial Content Guide

Blog articles and guides are typed, version-controlled entries in `features/content/content-registry.ts`. There is no CMS, database, Markdown, or runtime fetch.

## Adding content

1. Choose `blog` or `guide` and use the matching canonical path: `/blog/[slug]` or `/guides/[slug]`.
2. Reuse the central author, category, and tag objects from `content-types.ts`.
3. Add unique IDs, slugs, canonical paths, metadata titles, and section IDs.
4. Use structured paragraphs, lists, callouts, and tables. Never add unrestricted HTML or executable content.
5. Set `status` to `draft` until factual, editorial, link, and SEO checks are complete. Drafts are excluded publicly.
6. Calculate or verify reading time with `calculateReadingTime` and link only to live calculators and published editorial content.

## SEO and linking rules

Titles and descriptions must be unique and accurate. Publication dates must be genuine version-controlled dates; add an updated date only after a meaningful revision. Avoid ratings, fake images, credentials, guarantees, current rates, and unsupported claims. Use meaningful internal link text and safe external links. Do not add tag or category links unless their routes exist.

## Editorial checklist

- Explain assumptions, inputs, method, examples, and limitations clearly.
- Keep India-relevant copy educational and generic, without personalised advice or current tax thresholds.
- Add useful FAQs only, relevant calculators, related published content, and a financial-estimate disclaimer.
- Check heading order, table captions and headers, link destinations, mobile overflow, and keyboard focus.
- Keep homepage editorial search out of scope until a stable search route exists.

## Validation

Run `npm run test`, `npm run lint`, `npm run build`, and `git diff --check`.
