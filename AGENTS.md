<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# ThinkCalculator Project Rules

## Product Rules

- The public brand name is `ThinkCalculator`.
- The technical project name is `thinkcalculator`.
- The production domain is `https://thinkcalculator.in`.
- Build mobile-first and SEO-first.
- Prefer simple, understandable interfaces over decorative complexity.

## Architecture

- Use the Next.js App Router.
- Use TypeScript for all application code.
- Use Server Components by default.
- Add `"use client"` only when browser state, effects, events, or client-only APIs are required.
- Keep calculation logic separate from React components.
- Do not store executable formulas in a database.
- Keep calculator content and configuration version-controlled.
- Avoid introducing a database during Version 1 unless a feature clearly requires persistent user-generated data.

## Folder Responsibilities

- `app/`: routes, layouts, metadata files, loading and error states
- `components/ui/`: generic reusable UI primitives
- `components/layout/`: header, footer, navigation and page layout
- `features/calculators/`: calculator logic, schemas, components and tests
- `content/`: calculators, blogs, guides and glossary content
- `lib/`: shared integrations and infrastructure
- `utils/`: small pure utility functions
- `types/`: shared TypeScript types
- `tests/`: shared test support
- `docs/`: product and technical documentation

## TypeScript

- Do not use `any` unless unavoidable and documented.
- Define explicit input and result types for every calculator.
- Prefer pure functions for calculation logic.
- Validate user input before calculating.
- Return structured result objects instead of formatted strings.
- Format currency, percentage and dates only in the presentation layer.

## Components

- Give each component a clear single responsibility.
- Prefer composition over large configurable components.
- Avoid calculator-specific logic inside generic UI components.
- Use accessible labels, buttons, form controls and landmarks.
- Ensure keyboard navigation works.
- Avoid unnecessary client-side JavaScript.

## Calculators

Every calculator must include:

- Typed input model
- Validation rules
- Pure calculation function
- Typed result model
- Unit tests
- Page title and description
- Explanation of inputs
- Formula or calculation methodology
- Worked example
- Relevant FAQs
- Related calculators

Calculation functions must not:

- Read browser state
- Render UI
- Format display strings
- Make network calls
- Mutate input objects

## SEO

Every indexable page must provide:

- Unique title
- Unique meta description
- Canonical URL
- Clear H1
- Logical headings
- Internal links
- Breadcrumbs where appropriate

Use Next.js metadata APIs and metadata file conventions. Create structured data only when it accurately represents visible page content.

## Styling

- Use Tailwind CSS.
- Use shared design tokens.
- Avoid arbitrary values when an existing design token is suitable.
- Keep layouts responsive from small screens upward.
- Maintain strong contrast and visible focus states.
- Avoid heavy animation.

## Quality

Before completing a feature, run:

```bash
npm run lint
npm run build