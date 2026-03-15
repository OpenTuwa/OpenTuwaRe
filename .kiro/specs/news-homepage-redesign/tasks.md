# Implementation Plan: News Homepage Redesign

## Overview

Transform the homepage, archive, legal, and about pages into a professional news outlet layout. All data fetching, SEO metadata, bot renderer functions, and the article page remain untouched. Implementation is purely additive at the data layer — new UI components consume existing article objects.

## Tasks

- [x] 1. Add Tailwind keyframes and install fast-check
  - Add `ticker-scroll` keyframe to `tailwind.config.cjs` under `theme.extend.keyframes`
  - Add `ticker-scroll` animation entry under `theme.extend.animation`
  - Run `npm install --save-dev fast-check` (or confirm it is already present in package.json)
  - _Requirements: 2.1, 2.5_

- [x] 2. Create `src/utils/sections.js` — groupBySection utility
  - Implement `groupBySection(articles)` using `article.section?.trim() || article.category?.trim() || 'General'` label derivation
  - Export as named export
  - _Requirements: 4.2, 4.4_

  - [ ]* 2.1 Write property tests for groupBySection
    - **Property 1: Section grouping never loses articles** — total article count across all groups equals input length
    - **Validates: Requirements 4.1, 4.2, 4.4**
    - **Property 2: Section label derivation priority** — label equals section if non-empty, else category if non-empty, else "General"
    - **Validates: Requirements 4.2, 4.4**
    - Place tests in `src/utils/sections.test.js`

- [x] 3. Create `src/components/BreakingNewsTicker.jsx`
  - Accept `articles: Article[]` prop (5 pre-sliced items)
  - Render horizontally scrolling ticker using `animate-ticker-scroll` Tailwind class
  - Duplicate items array in DOM for seamless infinite loop
  - Pause animation on hover via `group-hover:[animation-play-state:paused]`
  - Each headline is a `<Link href="/articles/{slug}">` element
  - Prefix with a red "LATEST" badge
  - Render nothing when `articles` is empty
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.1 Write property test for BreakingNewsTicker
    - **Property 5: Ticker shows 5 most recent** — every rendered link href must correspond to one of the 5 input articles' slugs
    - **Validates: Requirements 2.1**
    - Place test in `src/components/BreakingNewsTicker.test.jsx`

  - [ ]* 3.2 Write unit tests for BreakingNewsTicker
    - Each ticker item href equals `/articles/{slug}`
    - Renders nothing when `articles=[]`
    - _Requirements: 2.1, 2.3_

- [x] 4. Create `src/components/HeroStory.jsx`
  - Accept `article: Article` prop
  - Full-width image with `bg-gradient-to-t from-black/70 via-black/30 to-transparent` overlay
  - Render title, subtitle, author, date, and primary tag overlaid bottom-left
  - Entire card wrapped in `<Link href="/articles/{slug}">`
  - Fallback: `bg-tuwa-gray` when `image_url` is null/empty — no `<img>` with empty src
  - Desktop ~560px tall, mobile ~320px tall
  - Render nothing when `article` is null/undefined
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 4.1 Write property test for HeroStory
    - **Property 9: HeroStory renders without crash** — for any article with title and slug, renders without throwing; null image_url uses fallback background
    - **Validates: Requirements 3.3, 3.7**
    - Place test in `src/components/HeroStory.test.jsx`

  - [ ]* 4.2 Write unit tests for HeroStory
    - Hero `<a>` href equals `/articles/{slug}`
    - `image_url=null` renders without crash, no `<img>` with empty src
    - _Requirements: 3.5, 3.7_

- [x] 5. Create `src/components/TrendingRail.jsx`
  - Accept `articles: Article[]` prop (top 5 pre-sliced)
  - Numbered list with rank displayed as `01`–`05` in `text-tuwa-gold`
  - Each item: rank + title + date, wrapped in `<Link href="/articles/{slug}">`
  - Background: `bg-tuwa-gray`, visually distinct from section grids
  - Render nothing when `articles` is empty
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.1 Write property test for TrendingRail ordering
    - **Property 3: Trending rail ordering** — displayed items ordered so no displayed item has lower score than any non-displayed item
    - **Validates: Requirements 5.1, 5.5**
    - **Property 4: Trending fallback to published_at** — when all trending_velocity=0, ordering matches published_at descending
    - **Validates: Requirements 5.5**
    - Place test in `src/components/TrendingRail.test.jsx`

  - [ ]* 5.2 Write unit tests for TrendingRail
    - Each item href equals `/articles/{slug}`
    - Renders nothing when `articles=[]`
    - _Requirements: 5.3_

- [x] 6. Create `src/components/SectionGrid.jsx`
  - Accept `sections: { label: string, articles: Article[] }[]` prop
  - Render one block per section with uppercase label + left accent bar
  - Grid: 3 cols desktop / 2 cols tablet / 1 col mobile
  - Slice to max 6 articles per section client-side
  - "View all →" link to `/archive` at bottom of each section
  - Use existing `ArticleCard` component for each article
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.1 Write property test for ArticleCard rendering
    - **Property 10: ArticleCard renders all required fields** — for any article with non-null title and slug, renders title and href equals `/articles/{slug}`; null fields omitted gracefully
    - **Validates: Requirements 4.6**
    - Place test in `src/components/ArticleCard.test.jsx`

  - [ ]* 6.2 Write unit tests for SectionGrid
    - Section grid "View all" link href equals `/archive`
    - Renders correct number of sections from input
    - _Requirements: 4.5_

- [x] 7. Checkpoint — Ensure all new component tests pass
  - Run `vitest --run` and confirm all tests in tasks 2–6 pass
  - Ask the user if questions arise before proceeding to modifications

- [x] 8. Modify `src/components/Navbar.jsx`
  - Add 3px red top strip: `<div className="bg-red-600 h-[3px] w-full" />` above the `<header>`
  - Accept `sections: string[]` prop; render dynamic section links to `/category/[slug]` (slugified lowercase) in the desktop nav and mobile menu
  - Replace conditional `showSearch` input with a search icon SVG button on the right side
  - Accept `hasBreaking: boolean` prop; render a red dot + "LIVE" badge when true
  - Preserve existing mobile hamburger menu, active link detection, and fixed positioning
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 8.1 Write unit tests for Navbar
    - Given `sections=["Politics","Culture"]`, links to `/category/politics` and `/category/culture` are rendered
    - Hamburger click shows/hides mobile menu
    - `hasBreaking=true` renders badge; `hasBreaking=false` does not
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 9. Modify `src/components/ArchiveContent.jsx`
  - Add article count header: derive count from `archiveData.flatMap(g => g.articles).length`
  - Add filter bar: year `<select>` and category `<select>` with client state (`useState`), no server fetch
  - Derive filter options from `archiveData` on mount
  - Replace timeline dot layout with table-like rows: `date | title (link) | author | tag`
  - Mobile: stacked card layout (date above title)
  - Render "No stories found" when filter produces empty results
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.2_

  - [ ]* 9.1 Write property tests for archive filtering
    - **Property 6: Archive year grouping correctness** — every article in a year group has published_at year matching the group key
    - **Validates: Requirements 6.2**
    - **Property 7: Archive total count accuracy** — displayed count equals sum of all articles across all year groups
    - **Validates: Requirements 6.4**
    - **Property 8: Archive filter produces valid subset** — filtered results are a subset of unfiltered; year/category constraints hold for every displayed article
    - **Validates: Requirements 6.6, 6.7**
    - Place tests in `src/components/ArchiveContent.test.jsx`

  - [ ]* 9.2 Write unit tests for ArchiveContent
    - Selecting year "2023" shows only 2023 articles
    - Selecting category "Politics" shows only Politics articles
    - Empty filter result renders "No stories found"
    - _Requirements: 6.6, 6.7_

- [x] 10. Modify `src/components/LegalContent.jsx`
  - Add masthead block at top of the component (above `<nav>`): large "OpenTuwa Legal" heading + subtitle
  - Add `font-serif leading-relaxed text-[1.0625rem]` classes to `.glass-panel` content divs
  - Style effective date `<div>` with `text-xs uppercase tracking-widest text-tuwa-muted border-l-2 border-tuwa-accent pl-3`
  - Add "Back to top" `<button>` at bottom of each `<article>` that calls `window.scrollTo({top:0, behavior:'smooth'})`
  - Preserve all existing tabs, TOC, language switcher, and legal text unchanged
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.3_

  - [ ]* 10.1 Write unit tests for LegalContent
    - All three tab buttons render
    - Switching tabs shows correct content
    - Each TOC anchor href matches the corresponding section id
    - Back-to-top button exists in each policy article
    - _Requirements: 7.1, 7.6, 7.7_

- [x] 11. Modify `src/components/AboutPageContent.jsx`
  - Add full-width masthead banner at top (before `<main>`): dark bg, large "About OpenTuwa" title, descriptor, `<hr className="border-white/10">` below
  - Change section `<h2>` labels to `text-xs uppercase tracking-widest font-bold` (small-caps style)
  - Wrap each author's role `<p>` in a badge pill: `border border-white/20 rounded-full px-2 py-0.5 text-[10px]`
  - Do NOT change any text content, author data, subscription form, or existing layout structure
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.4_

  - [ ]* 11.1 Write unit tests for AboutPageContent
    - About subscription form renders with email input and submit button
    - Each author renders name, role badge, and profile link
    - Masthead banner renders with page title
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 12. Modify `src/app/(site)/page.jsx` — wire homepage sub-components
  - Import `BreakingNewsTicker`, `HeroStory`, `SectionGrid`, `TrendingRail`, `groupBySection`
  - Derive `tickerArticles`: sort `articles` by `published_at` desc, slice 0–5
  - Derive `heroArticle`: `articles[0]`
  - Derive `sections`: `groupBySection(articles.slice(1))`
  - Derive `trendingArticles`: `articles.slice(0, 5)` (already sorted by trending score)
  - Derive `sections` string array for Navbar: unique labels from `sections`
  - Pass `hasBreaking={tickerArticles.length > 0}` to Navbar
  - Replace existing `<main>` grid with `<BreakingNewsTicker>`, `<HeroStory>`, `<SectionGrid>`, `<TrendingRail>`
  - Preserve `generateMetadata`, `fetchCandidates`, `RecommendationEngine`, `GraphSchema` — do NOT modify
  - _Requirements: 1.6, 2.1, 3.1, 3.2, 4.1, 5.1, 10.1, 10.3_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Run `vitest --run` and confirm all tests pass
  - Verify no TypeScript/lint errors with `getDiagnostics` on modified files
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `functions/index.js`, `functions/archive.js`, `functions/about.js`, `functions/legal.js` must NOT be modified
- `src/app/(site)/articles/[slug]/page.jsx` must NOT be modified
- `generateMetadata` in any page must NOT be modified
- All new components go in `src/components/`
- New utility goes in `src/utils/sections.js`
- fast-check property tests run minimum 100 iterations each
- Property test tag format: `// Feature: news-homepage-redesign, Property {N}: {property_text}`
