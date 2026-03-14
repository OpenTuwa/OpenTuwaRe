# Implementation Plan: SEO Infrastructure

## Overview

Patch existing files to close SEO gaps across crawlability, metadata quality, structured data, internal discoverability, social preview compatibility, content discovery, and technical SEO signals. No new components are introduced; all changes target existing files plus one new Cloudflare Function (`functions/sitemap-index.xml.js`).

## Tasks

- [x] 1. Crawlability — Dynamic sitemap-index and robots.txt fixes
  - [x] 1.1 Create `functions/sitemap-index.xml.js` that returns a valid XML sitemap index with live `<lastmod>` timestamps for `/sitemap.xml` and `/news-sitemap.xml`
    - Use `new Date().toISOString()` for `<lastmod>`; include error fallback returning minimal valid XML
    - _Requirements: 1.5, 1.6, 15.3_
  - [x] 1.2 Add `/sitemap-index.xml` to the `include` array in `public/_routes.json`
    - _Requirements: 15.2_
  - [x] 1.3 Update `functions/robots.txt.js` to add `Allow: /feed.xml` directive
    - Verify `/archive` and `/about` are not disallowed (they are not currently — confirm and keep)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 1.4 Write property test for sitemap-index lastmod currency (Property 3)
    - **Property 3: Sitemap-index lastmod is current**
    - Call the sitemap-index builder function, parse `<lastmod>`, assert the date is within 24 h of `Date.now()`
    - **Validates: Requirements 1.5, 1.6**

- [x] 2. Structured Data — StructuredData.jsx patches
  - [x] 2.1 Add `mainEntityOfPage` field to `NewsArticleSchema` in `src/components/StructuredData.jsx`
    - Value: `{ "@type": "WebPage", "@id": "https://opentuwa.com/articles/{slug}" }`
    - Derive from `article.slug` or `article.url`
    - _Requirements: 5.4_
  - [x] 2.2 Add `keywords` field (comma-separated tags string) to `NewsArticleSchema`
    - Parse tags defensively: try JSON parse, fall back to comma-split (same pattern as `feed.xml.js`)
    - Only emit `keywords` when tags array is non-empty
    - _Requirements: 5.6_
  - [x] 2.3 Guard `dateModified` in `NewsArticleSchema` so it is never earlier than `datePublished`
    - If `updated_at` is null or earlier than `published_at`, use `published_at` as `dateModified`
    - _Requirements: 5.7_
  - [x] 2.4 Ensure `image` field in `NewsArticleSchema` uses an absolute URL
    - If `image_url` is a relative path (starts with `/`), prepend `https://opentuwa.com`
    - _Requirements: 5.3_
  - [ ]* 2.5 Write property test for NewsArticle JSON-LD field completeness (Property 5)
    - **Property 5: NewsArticle JSON-LD field completeness**
    - Generate random article objects with fast-check, render `NewsArticleSchema`, parse the JSON-LD, assert `headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher`, `mainEntityOfPage` are all present
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.6**
  - [ ]* 2.6 Write property test for dateModified ≥ datePublished invariant (Property 6)
    - **Property 6: dateModified is never earlier than datePublished**
    - Generate pairs where `updated_at` may be before/after/null relative to `published_at`; assert `dateModified >= datePublished` in all cases
    - **Validates: Requirements 5.7**

- [x] 3. Structured Data — Remove duplicate OrganizationSchema / WebSiteSchema from page components
  - [x] 3.1 Remove `<OrganizationSchema />` and `<WebSiteSchema />` from `src/app/articles/[slug]/page.jsx` render output (root layout already emits them)
    - _Requirements: 6.1, 6.2_
  - [x] 3.2 Remove `<OrganizationSchema />` and `<WebSiteSchema />` from `src/app/(site)/archive/page.jsx` render output
    - _Requirements: 6.1, 6.2_
  - [x] 3.3 Remove `<OrganizationSchema />` and `<WebSiteSchema />` from `src/app/(site)/page.jsx` render output
    - _Requirements: 6.1, 6.2_
  - [x] 3.4 Remove `<OrganizationSchema />` and `<WebSiteSchema />` from `src/app/(site)/about/page.jsx` render output
    - _Requirements: 6.1, 6.2_
  - [x] 3.5 Remove `<OrganizationSchema />` and `<WebSiteSchema />` from `src/app/legal/page.jsx` render output
    - _Requirements: 6.1, 6.2_
  - [ ]* 3.6 Write property test for no duplicate Organization/WebSite JSON-LD per page (Property 7)
    - **Property 7: No duplicate Organization/WebSite JSON-LD per page**
    - Render a full page HTML string, count JSON-LD script blocks by `@type`, assert count of `NewsMediaOrganization` is exactly 1 and `WebSite` is exactly 1
    - **Validates: Requirements 6.1, 6.2**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Article page metadata — `src/app/articles/[slug]/page.jsx` patches
  - [x] 5.1 Add `og:image:width` and `og:image:height` to `generateMetadata`
    - When `image_url` is present use `1200` × `630`; for the fallback `/assets/ui/web_512.png` use `512` × `512`
    - _Requirements: 9.1, 9.2_
  - [x] 5.2 Add `robots: { ..., 'max-image-preview': 'large', 'max-snippet': -1 }` to `generateMetadata`
    - _Requirements: 3.7_
  - [x] 5.3 Add `twitter:creator` with `@` prefix to `generateMetadata`
    - `article.author ? \`@${article.author}\` : '@opentuwa'`
    - Already present in current code — verify the value is correct and the fallback is `@opentuwa`
    - _Requirements: 10.1, 10.2_
  - [x] 5.4 Add `article:published_time` and per-tag `article:tag` OG properties to `generateMetadata`
    - Map `tagsArray` to individual `article:tag` entries in the `openGraph` object
    - _Requirements: 3.5, 3.6_
  - [x] 5.5 Add `<meta name="author">` via the `authors` metadata field in `generateMetadata`
    - `authors: [{ name: article.author || 'OpenTuwa' }]`
    - _Requirements: 3.4_
  - [ ]* 5.6 Write property test for OG image dimensions declared (Property 10)
    - **Property 10: OG image dimensions declared**
    - Generate articles with and without `image_url`; assert `og:image:width` and `og:image:height` are always present in the metadata output
    - **Validates: Requirements 9.1, 9.2**
  - [ ]* 5.7 Write property test for twitter:creator @ prefix (Property 11)
    - **Property 11: twitter:creator has @ prefix**
    - Generate random non-empty author strings; assert the resulting `twitter:creator` value starts with `@`
    - **Validates: Requirements 10.1**

- [x] 6. Bot SSR — Enrich `functions/articles/[slug].js` head and body
  - [x] 6.1 Extend the D1 query in `functions/articles/[slug].js` to also fetch `author_name`, `tags`, `updated_at`, `excerpt`
    - _Requirements: 4.1, 4.2, 4.4_
  - [x] 6.2 Add full OG meta tags to the bot-rendered `<head>`: `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:type` (`"article"`), `og:url`
    - Resolve relative `image_url` to absolute URL using request origin
    - _Requirements: 4.1, 9.3_
  - [x] 6.3 Add Twitter Card meta tags to the bot-rendered `<head>`: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator`
    - `twitter:creator`: `article.author ? \`@${article.author}\` : '@opentuwa'`
    - _Requirements: 4.2_
  - [x] 6.4 Add `<link rel="canonical">` to the bot-rendered `<head>`
    - Value: `https://opentuwa.com/articles/${slug}`
    - _Requirements: 4.3, 14.4_
  - [x] 6.5 Add JSON-LD `NewsArticle` script block to the bot-rendered `<head>`
    - Include `headline`, `description`, `datePublished`, `dateModified` (guarded), `author`, `publisher` with logo, `mainEntityOfPage`, `image` (absolute URL), `keywords` (from tags)
    - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 6.6 Add a "Related Articles" section to the bot-rendered `<body>`
    - Query D1 for 3 articles `ORDER BY published_at DESC` excluding the current slug
    - Render as `<a href="/articles/{slug}">{title}</a>` links inside a `<section>` element
    - _Requirements: 7.2, 7.3_
  - [ ]* 6.7 Write property test for bot SSR article head completeness (Property 4)
    - **Property 4: Bot SSR article head completeness**
    - Generate random article objects, call the bot SSR renderer function, assert the HTML contains `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, a canonical link, and a JSON-LD script block
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - [ ]* 6.8 Write property test for related articles links in bot SSR (Property 8)
    - **Property 8: Related articles links present in bot SSR**
    - Generate an article + a list of ≥ 3 related articles, call the bot SSR renderer, count `<a href="/articles/...">` elements that differ from the current article URL, assert count ≥ 3
    - **Validates: Requirements 7.2, 7.3**

- [x] 7. Bot SSR — Enrich `functions/index.js` homepage head
  - [x] 7.1 Add OG meta tags to the homepage bot-rendered `<head>`: `og:title`, `og:description`, `og:image`, `og:type` (`"website"`), `og:url`
    - _Requirements: 4.5_
  - [x] 7.2 Add Twitter Card meta tags to the homepage bot-rendered `<head>`: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
    - _Requirements: 4.5_
  - [x] 7.3 Add `<link rel="canonical" href="https://opentuwa.com">` to the homepage bot-rendered `<head>`
    - _Requirements: 13.1_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Internal discoverability — Archive page crawlable links
  - [x] 9.1 Verify `ArchiveContent.jsx` already renders `<Link href="/articles/{slug}">` with article title as visible text (it does via Next.js `<Link>`) — no change needed; add a code comment confirming requirement coverage
    - _Requirements: 8.1, 8.3_
  - [x] 9.2 Add a bot SSR handler for the archive page in `functions/archive.js`
    - Detect bots using `isBot`; if bot, query D1 for all articles `ORDER BY published_at DESC`, render a minimal HTML page with `<a href="/articles/{slug}">{title}</a>` links
    - Include `<html lang="en">`, `<link rel="canonical" href="https://opentuwa.com/archive">`, and OG/Twitter meta tags in `<head>`
    - _Requirements: 8.2, 14.5_
  - [ ]* 9.3 Write property test for archive crawlable links (Property 9)
    - **Property 9: Archive links are crawlable**
    - Generate a list of articles, render the archive bot SSR HTML, assert each article slug has a corresponding `<a href="/articles/{slug}">` element with the article title as text
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 10. Technical SEO — Canonical URLs and semantic HTML
  - [x] 10.1 Verify canonical URLs on all static pages (homepage, archive, about, legal) — all already declare `alternates: { canonical: ... }` in their metadata exports; confirm no trailing slash issues
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_
  - [x] 10.2 Verify `ArticleView.jsx` wraps article body in `<article>` element and title in `<h1>` — already present; add code comment confirming requirement coverage
    - _Requirements: 14.1, 14.2_
  - [x] 10.3 Verify `functions/articles/[slug].js` bot SSR wraps content in `<article>` with title in `<h1>` and includes `<nav>` with homepage link — already present; confirm `<html lang="en">` is on the root element
    - _Requirements: 14.3, 14.4, 14.5_
  - [ ]* 10.4 Write property test for canonical URL format (Property 13)
    - **Property 13: Canonical URL format**
    - Generate random slugs and page names, assert the canonical URL matches `^https://opentuwa\\.com(/articles/[a-z0-9-]+)?$` (no trailing slash except bare homepage)
    - **Validates: Requirements 13.6**

- [x] 11. Content discovery — RSS feed and feed discovery link
  - [x] 11.1 Verify `functions/feed.xml.js` already includes all required fields (`<title>`, `<link>`, `<guid isPermaLink="true">`, `<pubDate>`, `<description>`, `<dc:creator>`, `<media:content>`, `<atom:link rel="self">`, `<language>en-us</language>`, `<category>` per tag, `Content-Type: application/rss+xml`) and limits to 50 articles — all present; add a code comment confirming requirement coverage
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  - [x] 11.2 Verify `src/app/layout.jsx` already declares `alternates.types['application/rss+xml']: '/feed.xml'` — present; confirm the `<link rel="alternate">` tag is emitted in `<head>` by Next.js
    - _Requirements: 12.1, 12.2_
  - [ ]* 11.3 Write property test for RSS feed entry field completeness (Property 12)
    - **Property 12: Feed entry field completeness**
    - Generate random article arrays with fast-check, call the feed XML builder logic, parse the output XML, assert each `<item>` contains `<title>`, `<link>`, `<guid isPermaLink="true">`, `<pubDate>`, `<description>`, `<dc:creator>`
    - **Validates: Requirements 11.1**

- [ ] 12. Property-based tests — Sitemap correctness (Properties 1, 2)
  - [ ]* 12.1 Write property test for sitemap completeness (Property 1)
    - **Property 1: Sitemap contains all articles**
    - Generate random article arrays, call the sitemap builder function, assert every article slug appears as a `<loc>` entry and no unexpected entries are present
    - **Validates: Requirements 1.1**
  - [ ]* 12.2 Write property test for sitemap lastmod ISO 8601 validity (Property 2)
    - **Property 2: Sitemap lastmod is valid ISO 8601**
    - Generate random `published_at` timestamps (valid dates, invalid strings, null), assert the `<lastmod>` output either matches the ISO 8601 regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}` or is absent when input is null/invalid
    - **Validates: Requirements 1.2**

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property-based tests use `fast-check` (already in `devDependencies`) with `{ numRuns: 100 }` minimum
- Each property test file should be tagged with `// Feature: seo-infrastructure, Property N: <property_text>`
- No database schema changes are required
- Cloudflare Workers edge runtime compatibility must be maintained (no Node.js-only APIs)
