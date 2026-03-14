# Implementation Plan: SEO Infrastructure

## Overview

Incremental implementation across four pillars: technical SEO & crawl efficiency, enterprise JSON-LD `@graph` schema, DOM semantics & accessibility, and Core Web Vitals. Each task builds on the previous, ending with full integration and test coverage.

## Tasks

- [x] 1. Create shared schema builder utility
  - Create `functions/_utils/schema.js` exporting `buildArticleGraph`, `buildHomepageGraph`, and `buildArchiveGraph`
  - Each builder returns a `@graph` array matching the data model in the design
  - Guard `dateModified`: if `updated_at` is missing or earlier than `published_at`, fall back to `published_at`
  - Guard `datePublished`: omit if missing or unparseable (never emit `null` or `"Invalid Date"`)
  - Resolve relative `image_url` to absolute using the site origin constant `https://opentuwa.com`
  - Parse `tags` defensively: try `JSON.parse` first, fall back to CSV split; omit `keywords` if result is empty
  - Omit `image` node if `image_url` is empty
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.1 Write property test for dateModified guard (Property 7)
    - **Property 7: dateModified never precedes datePublished**
    - **Validates: Requirements 2.2**
    - Use `fc.tuple(fc.date(), fc.date())` to generate random date pairs

  - [ ]* 1.2 Write property test for tags round-trip (Property 8)
    - **Property 8: Tags round-trip to keywords string**
    - **Validates: Requirements 2.4**
    - Use `fc.oneof(fc.array(fc.string()), fc.string())` for tags input

  - [ ]* 1.3 Write property test for @graph completeness (Property 6)
    - **Property 6: Article @graph completeness**
    - **Validates: Requirements 2.1**
    - Use `fc.record({...article fields})` to generate random articles

- [x] 2. Refactor `StructuredData.jsx` into a single `GraphSchema` component
  - Replace the five separate schema components (`NewsArticleSchema`, `OrganizationSchema`, `WebSiteSchema`, `BreadcrumbSchema`, `CollectionPageSchema`) with a single `<GraphSchema type="article|homepage|archive" data={...} />` component
  - Internally call the same logic as `functions/_utils/schema.js` (or a JS-portable copy) to guarantee bot/React parity
  - Emit exactly one `<script type="application/ld+json">` block per page containing the full `@graph` array
  - Homepage graph: `[WebSite (with potentialAction), NewsMediaOrganization, BreadcrumbList]`
  - Article graph: `[NewsArticle, Person, NewsMediaOrganization, BreadcrumbList]`
  - Archive graph: `[CollectionPage, NewsMediaOrganization, BreadcrumbList]`
  - Update all call sites: `src/app/(site)/page.jsx`, article page, archive page, about page, legal page
  - _Requirements: 2.1, 2.5, 2.6_

  - [ ]* 2.1 Write property test for bot/React schema parity (Property 9)
    - **Property 9: Bot SSR and React schema parity**
    - **Validates: Requirements 2.6**
    - Use `fc.record({...article fields})` and compare `@type` values, `headline`, `datePublished`, `dateModified`, `mainEntityOfPage`

- [x] 3. Update bot SSR Workers to use shared schema builder
  - In `functions/articles/[slug].js`: replace the inline `jsonLd` object with `buildArticleGraph(article, SITE_URL)` from `functions/_utils/schema.js`
  - In `functions/index.js`: replace the inline `WebSite` schema with `buildHomepageGraph(SITE_URL)`
  - Ensure both Workers still call `esc()` on all user-supplied strings interpolated into HTML
  - Ensure `context.next()` fallthrough is preserved for missing articles and DB errors
  - _Requirements: 2.6, 1.7_

- [x] 4. Fix `robots.txt` and sitemap hierarchy
  - In `functions/robots.txt.js`: change `Disallow: /_next/` to `Disallow: /_next/static/`; add `Crawl-delay: 10` for `User-agent: *`; keep only `Sitemap: {origin}/sitemap-index.xml` (remove the two redundant sitemap lines)
  - In `functions/sitemap.xml.js`: replace `<lastmod>${now}</lastmod>` for articles with `<lastmod>${toISO(a.updated_at || a.published_at)}</lastmod>` so lastmod reflects actual content change, not request time; static pages may keep `now`
  - In `functions/news-sitemap.xml.js`: change the 7-day cutoff to 48 hours (`2 * 24 * 60 * 60 * 1000`); remove the fallback that adds the latest article when no recent articles exist (an empty sitemap is correct per spec)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 4.1 Write property test for robots.txt directives (Property 1)
    - **Property 1: robots.txt disallows private paths**
    - **Validates: Requirements 1.1**
    - Parse the response text and assert `Disallow: /api/` and `Disallow: /_next/static/` are present; assert `/`, `/articles/`, `/archive`, `/about` are not disallowed

  - [ ]* 4.2 Write property test for sitemap article coverage (Property 2)
    - **Property 2: Sitemap article coverage**
    - **Validates: Requirements 1.3**
    - Use `fc.array(fc.record({slug, title, image_url, published_at, updated_at}))` and assert every article has `<loc>` and `<lastmod>`, and every article with `image_url` has `<image:image>`

  - [ ]* 4.3 Write property test for news sitemap recency filter (Property 3)
    - **Property 3: News sitemap recency filter**
    - **Validates: Requirements 1.4**
    - Use `fc.array(fc.record({...}))` with random `published_at` offsets; assert only articles within 48 h appear and each has `<news:publication_date>` and `<news:title>`

- [x] 5. Implement canonical URL and noindex logic
  - In `functions/index.js`: update `canonicalUrl` to always use `https://opentuwa.com` (not `origin`) for the bare homepage; variant pages (`?author=`, `?tag=`, `?q=`) already use their own URL — verify this is correct per design
  - In `functions/articles/[slug].js`: verify canonical is `https://opentuwa.com/articles/${slug}` (already correct — confirm no trailing slash)
  - In Next.js pages: audit `metadata.alternates.canonical` in each page file to ensure no trailing slashes and always uses the production domain
  - Add `noindex` robots meta to Next.js homepage when `searchParams` contains `author`, `tag`, or `q` (currently only the bot SSR path handles this)
  - _Requirements: 1.5, 1.6_

  - [ ]* 5.1 Write property test for single canonical URL (Property 4)
    - **Property 4: Single canonical URL per page**
    - **Validates: Requirements 1.5**
    - Use `fc.record({slug, params})` and assert exactly one canonical tag with no trailing slash

  - [ ]* 5.2 Write property test for variant noindex (Property 5)
    - **Property 5: Variant pages are noindex**
    - **Validates: Requirements 1.6**
    - Use `fc.oneof(fc.string(), fc.constant(''))` for each query param and assert `noindex` appears in robots meta

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Fix accessibility in `ArticleView.jsx` and layout components
  - Add `id="article-heading"` to the `<h1>` inside `ArticleView.jsx` and add `aria-labelledby="article-heading"` to the `<article>` element
  - Add `role="progressbar"` with `aria-valuenow={Math.round(readingProgress)}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-label="Reading progress"` to the reading progress bar `<div>`
  - Add `role="search"` and `aria-label="Search articles"` to the wrapper `<div>` around the search `<input>` in the header
  - Audit all `<nav>` elements across `ArticleView.jsx`, `Layout.jsx`, `Navbar.jsx`, and bot SSR HTML: ensure every `<nav>` has a unique `aria-label` (e.g. "Site navigation", "Article navigation", "Footer navigation")
  - Add a skip-to-content link as the first focusable element in `Layout.jsx` or the root layout: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ]* 7.1 Write property test for single h1 per page (Property 10)
    - **Property 10: Single h1 per page**
    - **Validates: Requirements 3.2**
    - Render pages via jsdom with `fc.record({...article fields})` and assert exactly one `<h1>` in the DOM

  - [ ]* 7.2 Write property test for unique nav aria-labels (Property 11)
    - **Property 11: Unique aria-labels on nav elements**
    - **Validates: Requirements 3.4**
    - Render page DOM and assert all `<nav aria-label>` values are distinct

- [x] 8. Fix colour contrast token for body text
  - In the global CSS (or Tailwind config), update `--tuwa-muted` from `#a1a1aa` to `#c4c4c4` (or equivalent value achieving ≥ 7.0:1 contrast ratio against `#0a0a0b`)
  - Update the same value in the inline `<style>` blocks in `functions/index.js` and `functions/articles/[slug].js` bot SSR HTML
  - _Requirements: 3.5_

  - [ ]* 8.1 Write property test for body text contrast (Property 12)
    - **Property 12: Body text contrast meets WCAG AAA**
    - **Validates: Requirements 3.5**
    - Compute WCAG relative luminance contrast ratio programmatically for the `--tuwa-muted` / `#0a0a0b` pair and assert ≥ 7.0:1

- [x] 9. Fix Core Web Vitals — LCP hero image
  - In `ArticleView.jsx`: change the hero `<SkeletonImage>` to a plain `<img>` with `fetchpriority="high"` and `loading="eager"` (the skeleton wrapper adds unnecessary complexity for the LCP element)
  - Add explicit `width={1200}` and `height={630}` props to the hero image
  - In the article page server component (`src/app/articles/[slug]/page.jsx` or equivalent), inject a `<link rel="preload" as="image" href={article.image_url}>` in the `<head>` when `image_url` is non-empty
  - _Requirements: 4.1_

  - [ ]* 9.1 Write property test for hero image priority attributes (Property 13)
    - **Property 13: Hero image has priority loading attributes**
    - **Validates: Requirements 4.1**
    - Use `fc.record({image_url: fc.webUrl()})` and assert rendered `<img>` has `fetchpriority="high"` and `loading="eager"`

- [x] 10. Fix Core Web Vitals — CLS layout stability
  - In `SkeletonImage.jsx`: add `width` and `height` props to the component interface; when provided, set them as inline styles (or HTML attributes) on the wrapper `<div>` so the browser reserves space before the image loads; alternatively, accept an `aspectRatio` prop and apply `aspect-ratio` CSS
  - Update all `<SkeletonImage>` call sites in `ArticleView.jsx` (sidebar thumbnails, recommendation cards) to pass explicit `width` and `height` or `aspectRatio`
  - _Requirements: 4.2_

  - [ ]* 10.1 Write property test for SkeletonImage layout space reservation (Property 14)
    - **Property 14: SkeletonImage reserves layout space**
    - **Validates: Requirements 4.2**
    - Use `fc.record({src: fc.webUrl(), width: fc.nat(), height: fc.nat()})` and assert the root element has explicit dimensions or `aspect-ratio`

- [x] 11. Fix Core Web Vitals — INP interaction responsiveness
  - In `ArticleView.jsx`: wrap the `fetch('/api/track-interaction', ...)` call inside the `useEffect` (the initial `view` event) with `requestIdleCallback` (with a `setTimeout` fallback for Safari)
  - _Requirements: 4.3_

- [x] 12. Fix static asset cache headers
  - In `public/_headers` (Cloudflare Pages headers file): add or update rules for `/assets/*` and `/img/*` to include `Cache-Control: public, max-age=31536000, immutable`
  - Verify `next.config.mjs` does not override these headers for static asset paths
  - _Requirements: 4.4_

  - [ ]* 12.1 Write property test for static asset cache headers (Property 15)
    - **Property 15: Static assets have immutable cache headers**
    - **Validates: Requirements 4.4**
    - Use `fc.constantFrom('/assets/ui/logo.png', '/img/photo.jpg', ...)` and assert `Cache-Control` contains `immutable` and `max-age=31536000`

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- Each property test file must include a comment: `// Feature: seo-infrastructure, Property N: <property_text>`
- Test runner: Vitest (`vitest --run` for single execution)
