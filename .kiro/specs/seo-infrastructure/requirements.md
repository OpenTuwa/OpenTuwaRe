# Requirements Document

## Introduction

OpenTuwa is an independent journalism platform running on Cloudflare Pages with Next.js (edge runtime). Articles are stored in a Cloudflare D1 database. The platform already has a meaningful SEO foundation: per-page Open Graph and Twitter Card metadata, JSON-LD structured data components, a dynamic sitemap, a news sitemap, an RSS feed, a robots.txt, and a bot-detection layer that serves SSR HTML to crawlers.

This feature addresses the gaps and weaknesses identified in that existing infrastructure across seven areas: crawlability, metadata quality, structured data, internal discoverability, social preview compatibility, content discovery, and technical SEO signals. No article content, editorial writing, or database schema will be modified.

## Glossary

- **System**: The OpenTuwa Cloudflare Pages application (Next.js edge runtime + Cloudflare Functions).
- **Crawler**: Any search engine bot, social media scraper, or feed reader that fetches pages.
- **Bot_SSR_Layer**: The Cloudflare Functions middleware (`functions/index.js`, `functions/articles/[slug].js`) that detects bots and returns server-rendered HTML.
- **Sitemap_Function**: The Cloudflare Function at `functions/sitemap.xml.js` that generates the dynamic XML sitemap from D1.
- **News_Sitemap_Function**: The Cloudflare Function at `functions/news-sitemap.xml.js`.
- **Feed_Function**: The Cloudflare Function at `functions/feed.xml.js` that generates the RSS feed.
- **Sitemap_Index**: The static file `public/sitemap-index.xml` that references all sitemaps.
- **StructuredData**: The React components in `src/components/StructuredData.jsx` that emit JSON-LD.
- **Article_Page**: The Next.js route at `src/app/articles/[slug]/page.jsx`.
- **Static_Sitemaps**: The static XML files in `public/` (`sitemap.xml`, `news-sitemap.xml`, `feed.xml`) that are stale copies and should not be served in place of the dynamic functions.
- **Canonical_URL**: The authoritative URL for a page, declared via `<link rel="canonical">`.
- **OG_Image**: The Open Graph image used for social link previews.
- **JSON-LD**: JavaScript Object Notation for Linked Data, used for structured data markup.
- **NewsArticle**: The schema.org type used for article structured data.
- **Atom_Feed**: An alternative feed format to RSS.


## Requirements

### Requirement 1: Crawlability — Dynamic Sitemap Completeness

**User Story:** As a search engine crawler, I want the sitemap to include all public article URLs with accurate metadata, so that I can discover and index every article efficiently.

#### Acceptance Criteria

1. WHEN a crawler requests `/sitemap.xml`, THE Sitemap_Function SHALL return a valid XML sitemap containing one `<url>` entry per article in D1.
2. WHEN an article has a `published_at` value, THE Sitemap_Function SHALL include a `<lastmod>` element with that value formatted as ISO 8601.
3. WHEN an article has an `image_url` value, THE Sitemap_Function SHALL include a `<image:image>` element with the resolved absolute URL and the article title as `<image:title>`.
4. THE Sitemap_Function SHALL set `<priority>0.8</priority>` for article URLs and `<priority>1.0</priority>` for the homepage.
5. WHEN a crawler requests `/sitemap-index.xml`, THE System SHALL return a sitemap index that references `/sitemap.xml` and `/news-sitemap.xml` with a `<lastmod>` value reflecting the current date.
6. THE Sitemap_Index SHALL be served dynamically by a Cloudflare Function so that `<lastmod>` is always current, rather than from a stale static file.

### Requirement 2: Crawlability — Robots.txt Accuracy

**User Story:** As a search engine crawler, I want a robots.txt that accurately reflects which paths are crawlable, so that I do not waste crawl budget on non-content routes.

#### Acceptance Criteria

1. WHEN a crawler requests `/robots.txt`, THE System SHALL return a robots.txt that disallows `/api/` and `/_next/` for all user agents.
2. THE System SHALL include `Sitemap:` directives pointing to `/sitemap-index.xml`, `/sitemap.xml`, and `/news-sitemap.xml`.
3. THE System SHALL explicitly allow the `/feed.xml` path for all crawlers.
4. THE System SHALL NOT disallow the `/archive` or `/about` paths.

### Requirement 3: Metadata Quality — Article Pages

**User Story:** As a search engine, I want each article page to expose complete, accurate metadata, so that I can correctly understand and rank the article.

#### Acceptance Criteria

1. WHEN an article page is rendered, THE Article_Page SHALL include a `<link rel="canonical">` tag with the absolute URL `https://opentuwa.com/articles/{slug}`.
2. WHEN an article has a non-empty `seo_description` field, THE Article_Page SHALL use that value as the `<meta name="description">` content.
3. IF an article's `seo_description` is empty, THEN THE Article_Page SHALL fall back to `subtitle`, then `excerpt`, then the article `title`.
4. WHEN an article has a non-empty `author` field, THE Article_Page SHALL include a `<meta name="author">` tag with that value.
5. WHEN an article has a non-empty `published_at` field, THE Article_Page SHALL include `<meta property="article:published_time">` with the ISO 8601 value.
6. WHEN an article has tags, THE Article_Page SHALL include one `<meta property="article:tag">` element per tag.
7. THE Article_Page SHALL include `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`.

### Requirement 4: Metadata Quality — Bot SSR Layer

**User Story:** As a search engine crawler, I want the bot-rendered HTML for article pages to include the same metadata as the Next.js-rendered version, so that crawlers receive consistent signals regardless of which rendering path serves them.

#### Acceptance Criteria

1. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta property="og:type" content="article">`, and `<meta property="og:url">` in the `<head>`.
2. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title">`, `<meta name="twitter:description">`, and `<meta name="twitter:image">`.
3. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include a `<link rel="canonical">` tag.
4. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include a JSON-LD `NewsArticle` script block.
5. WHEN the Bot_SSR_Layer serves the homepage, THE Bot_SSR_Layer SHALL include `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, and `<meta name="twitter:card">`.


### Requirement 5: Structured Data — NewsArticle Schema Completeness

**User Story:** As a search engine, I want complete and valid NewsArticle structured data on article pages, so that articles are eligible for rich results in search.

#### Acceptance Criteria

1. WHEN an article page is rendered, THE StructuredData component SHALL emit a JSON-LD block with `@type: "NewsArticle"`.
2. THE NewsArticle JSON-LD SHALL include `headline`, `description`, `datePublished`, `dateModified`, `author`, and `publisher` fields.
3. WHEN an article has an `image_url`, THE NewsArticle JSON-LD SHALL include an `image` field with the absolute URL.
4. WHEN an article has a `url` or `slug`, THE NewsArticle JSON-LD SHALL include a `mainEntityOfPage` field with the canonical article URL.
5. THE NewsArticle JSON-LD `publisher` field SHALL include a `logo` object with `@type: "ImageObject"` and the absolute URL of the site logo.
6. WHEN an article has tags, THE NewsArticle JSON-LD SHALL include a `keywords` field containing the tags as a comma-separated string.
7. THE StructuredData component SHALL NOT emit a `dateModified` value that is earlier than `datePublished`.

### Requirement 6: Structured Data — WebSite and Organization Deduplication

**User Story:** As a search engine, I want each page to emit structured data exactly once per schema type, so that I receive unambiguous signals without conflicting duplicates.

#### Acceptance Criteria

1. THE Root_Layout SHALL emit the `OrganizationSchema` and `WebSiteSchema` JSON-LD blocks exactly once per page render.
2. WHEN a page component also renders `OrganizationSchema` or `WebSiteSchema`, THE System SHALL NOT emit duplicate JSON-LD blocks for those types on the same page.
3. THE WebSiteSchema JSON-LD SHALL include a `potentialAction` of type `SearchAction` with `urlTemplate: "https://opentuwa.com/?q={search_term_string}"`.

### Requirement 7: Internal Discoverability — Related Articles Linking

**User Story:** As a search engine crawler, I want article pages to contain crawlable links to related articles, so that I can discover the full article graph without relying solely on the sitemap.

#### Acceptance Criteria

1. WHEN an article page is rendered and recommendations are available, THE Article_Page SHALL render at least one `<a>` element linking to each recommended article using its canonical `/articles/{slug}` path.
2. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include a "Related Articles" section with crawlable `<a>` links to at least 3 other articles fetched from D1.
3. THE Bot_SSR_Layer related articles query SHALL select articles by recency (`ORDER BY published_at DESC`) excluding the current article's slug.
4. WHEN the Bot_SSR_Layer serves the homepage, THE Bot_SSR_Layer SHALL render article titles as crawlable `<a>` links (this already exists and SHALL be preserved).

### Requirement 8: Internal Discoverability — Archive Page Linking

**User Story:** As a search engine crawler, I want the archive page to contain crawlable links to every article, so that all articles are reachable within two hops from the homepage.

#### Acceptance Criteria

1. WHEN the archive page is rendered, THE System SHALL render each article title as a crawlable `<a>` element linking to `/articles/{slug}`.
2. WHEN the Bot_SSR_Layer serves the archive page, THE Bot_SSR_Layer SHALL render the same crawlable article link list.
3. THE archive page `<a>` elements SHALL use the article's `title` as the visible link text.


### Requirement 9: Social Preview Compatibility — OG Image Dimensions

**User Story:** As a reader sharing an article link on a social platform, I want the link preview to display a correctly sized image, so that the preview renders properly on Twitter, Facebook, LinkedIn, and WhatsApp.

#### Acceptance Criteria

1. WHEN an article has an `image_url`, THE Article_Page metadata SHALL include `og:image:width` and `og:image:height` properties.
2. THE default fallback OG image (`/assets/ui/web_512.png`) SHALL have `og:image:width: 512` and `og:image:height: 512` declared in the metadata.
3. WHEN the Bot_SSR_Layer serves an article page, THE Bot_SSR_Layer SHALL include `<meta property="og:image:width">` and `<meta property="og:image:height">` tags.
4. THE `og:type` for article pages SHALL be `"article"` and for non-article pages SHALL be `"website"`.

### Requirement 10: Social Preview Compatibility — Twitter Card Author

**User Story:** As a reader sharing an article, I want the Twitter card to credit the correct author handle, so that the author receives proper attribution on social platforms.

#### Acceptance Criteria

1. WHEN an article has a non-empty `author` field, THE Article_Page metadata SHALL set `twitter:creator` to the author's value prefixed with `@`.
2. IF an article has no `author` field, THEN THE Article_Page metadata SHALL set `twitter:creator` to `@opentuwa`.

### Requirement 11: Content Discovery — RSS Feed Quality

**User Story:** As a feed reader or news aggregator, I want the RSS feed to contain complete, well-formed entries, so that I can display article previews accurately.

#### Acceptance Criteria

1. WHEN the Feed_Function generates a feed entry, THE Feed_Function SHALL include `<title>`, `<link>`, `<guid isPermaLink="true">`, `<pubDate>`, `<description>`, and `<dc:creator>` elements for each article.
2. WHEN an article has an `image_url`, THE Feed_Function SHALL include a `<media:content>` element with the absolute image URL and `medium="image"`.
3. THE Feed_Function SHALL include an `<atom:link rel="self">` element in the channel pointing to the feed's own URL.
4. THE Feed_Function SHALL set `<language>en-us</language>` in the channel.
5. WHEN an article has tags, THE Feed_Function SHALL include `<category>` elements for each tag.
6. THE Feed_Function response SHALL include the HTTP header `Content-Type: application/rss+xml; charset=utf-8`.
7. THE Feed_Function SHALL limit the feed to the 50 most recently published articles ordered by `published_at DESC`.

### Requirement 12: Content Discovery — Feed Discovery Link

**User Story:** As a feed reader, I want to auto-discover the RSS feed from any page on the site, so that I can subscribe without manually finding the feed URL.

#### Acceptance Criteria

1. THE Root_Layout SHALL include a `<link rel="alternate" type="application/rss+xml" title="OpenTuwa RSS Feed" href="/feed.xml">` element in the `<head>`.
2. THE Root_Layout `alternates.types` metadata SHALL declare `'application/rss+xml': '/feed.xml'`.

### Requirement 13: Technical SEO — Canonical URL Consistency

**User Story:** As a search engine, I want every page to declare a canonical URL, so that I consolidate ranking signals to the correct URL and avoid indexing duplicates.

#### Acceptance Criteria

1. THE homepage SHALL declare `<link rel="canonical" href="https://opentuwa.com">`.
2. THE archive page SHALL declare `<link rel="canonical" href="https://opentuwa.com/archive">`.
3. THE about page SHALL declare `<link rel="canonical" href="https://opentuwa.com/about">`.
4. THE legal page SHALL declare `<link rel="canonical" href="https://opentuwa.com/legal">`.
5. WHEN an article page is rendered, THE Article_Page SHALL declare `<link rel="canonical" href="https://opentuwa.com/articles/{slug}">`.
6. THE canonical URL SHALL use `https://` and the `opentuwa.com` domain without a trailing slash (except the homepage which uses the bare domain).

### Requirement 14: Technical SEO — Semantic HTML Structure

**User Story:** As a search engine crawler, I want article pages to use correct semantic HTML elements, so that I can identify the primary content, headings, and navigation regions accurately.

#### Acceptance Criteria

1. WHEN an article page is rendered, THE Article_Page SHALL wrap the article body in an `<article>` element.
2. WHEN an article page is rendered, THE Article_Page SHALL render the article title in an `<h1>` element.
3. THE Bot_SSR_Layer article HTML SHALL wrap content in an `<article>` element with the title in an `<h1>`.
4. THE Bot_SSR_Layer article HTML SHALL include a `<nav>` element with a link back to the homepage.
5. WHEN the Bot_SSR_Layer serves any page, THE Bot_SSR_Layer SHALL include `<html lang="en">` on the root element.

### Requirement 15: Technical SEO — Static Sitemap Files Superseded

**User Story:** As a search engine crawler, I want the sitemaps I receive to always reflect the current state of the article database, so that I do not waste crawl budget on stale or missing URLs.

#### Acceptance Criteria

1. THE static files `public/sitemap.xml`, `public/news-sitemap.xml`, and `public/feed.xml` SHALL be superseded by their corresponding Cloudflare Functions, which are already registered in `public/_routes.json`.
2. THE `public/_routes.json` SHALL include `/sitemap-index.xml` in the `include` array so the dynamic sitemap index function is served by the Worker.
3. THE `public/sitemap-index.xml` static file SHALL be replaced by a Cloudflare Function at `functions/sitemap-index.xml.js` that generates the index with a current `<lastmod>` timestamp.

