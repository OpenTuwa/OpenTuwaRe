# Design Document: News Homepage Redesign

## Overview

This redesign transforms OpenTuwa's homepage, archive, legal, and about pages from a blog-style aesthetic into a professional news outlet layout — visually consistent with BBC, Reuters, AP, and Al Jazeera. The goal is editorial hierarchy, dense information display, and clear typographic structure, while leaving all existing data fetching, SEO metadata, bot renderer functions, and the article page completely untouched.

The implementation is purely additive at the data layer: no new API routes or database schema changes are required. All article data continues to flow through the existing `fetchCandidates` + `RecommendationEngine` pipeline. New UI components consume the same article objects already returned by that pipeline.

### Key Design Decisions

- **Section grouping**: Derived client-side from `article.section` → `article.category` → `"General"` fallback. No DB changes needed.
- **Navbar section links**: Dynamically derived from the unique section/category values in the fetched article set, linking to existing `/category/[slug]` pages.
- **Breaking news ticker**: Pure CSS `@keyframes` animation (no JS interval), paused via `animation-play-state: paused` on hover. Takes the 5 most recently published articles by `published_at` desc.
- **Trending rail**: Uses the same `RecommendationEngine.getTrending()` output already computed on the homepage — no second fetch. Top 5 items sliced from the ranked list.
- **Hero story**: `articles[0]` from the `getTrending()` result (highest composite score).
- **Archive filter**: Client-side state in `ArchiveContent.jsx` — no new server fetch on filter change.

---

## Architecture

The redesign follows the existing Next.js App Router + Cloudflare Pages Functions architecture. No new runtime boundaries are introduced.

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (Edge Runtime)                                │
│                                                                 │
│  src/app/(site)/page.jsx  ──fetchCandidates──►  D1 SQLite      │
│         │                  RecommendationEngine                 │
│         │  articles[]                                           │
│         ▼                                                       │
│  BreakingNewsTicker  (articles[0..4] by published_at)          │
│  HeroStory           (articles[0] by trending score)           │
│  SectionGrid         (articles grouped by section/category)    │
│  TrendingRail        (articles[0..4] by trending score)        │
│                                                                 │
│  src/app/(site)/archive/page.jsx  ──D1 query──►  D1 SQLite     │
│         │  archiveData[]                                        │
│         ▼                                                       │
│  ArchiveContent  (client: filter state, year/category UI)      │
│                                                                 │
│  src/components/Navbar.jsx  (client: mobile menu, sections)    │
│  src/components/LegalContent.jsx  (client: tabs, TOC, back-top)│
│  src/components/AboutPageContent.jsx  (client: subscribe form) │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Homepage

```
page.jsx (server, edge)
  └─ fetchCandidates(env, 100)          → raw articles from D1
  └─ RecommendationEngine.getTrending() → scored + sorted articles[]
       │
       ├─ articles.slice(0,5) sorted by published_at → BreakingNewsTicker
       ├─ articles[0]                               → HeroStory
       ├─ groupBySection(articles.slice(1))         → SectionGrid[]
       └─ articles.slice(0,5)                       → TrendingRail
```

All four homepage sub-components receive pre-computed data as props from the server component. No client-side fetches on the homepage.

### Constraint: No Modifications to Existing Logic

- `generateMetadata`, `fetchCandidates`, `RecommendationEngine` — read-only
- `functions/index.js` and all other bot renderer functions — untouched
- `src/app/(site)/articles/[slug]/page.jsx` — untouched
- `src/app/(site)/archive/page.jsx` server component — only the `ArchiveContent` client component is modified

---

## Components and Interfaces

### New Components

#### `BreakingNewsTicker` — `src/components/BreakingNewsTicker.jsx`

```
Props:
  articles: Article[]   // 5 most recent articles (pre-sliced by server)

Behavior:
  - Renders a horizontally scrolling ticker using CSS @keyframes (ticker-scroll)
  - animation-play-state: paused on hover via Tailwind group-hover
  - Each headline is a <Link href="/articles/{slug}"> element
  - Prefixed with a red "BREAKING" or "LATEST" badge
  - Loops infinitely: duplicate the items array in the DOM for seamless loop
```

#### `HeroStory` — `src/components/HeroStory.jsx`

```
Props:
  article: Article      // articles[0] from getTrending()

Behavior:
  - Full-width image with dark gradient overlay (from-black/70 via-black/30 to-transparent)
  - Text (title, subtitle, author, date, tag) overlaid on image bottom-left
  - Entire card is a <Link href="/articles/{slug}">
  - Fallback: bg-tuwa-gray when image_url is null/empty
  - Desktop: ~560px tall; Mobile: ~320px tall, stacked layout
```

#### `SectionGrid` — `src/components/SectionGrid.jsx`

```
Props:
  sections: { label: string, articles: Article[] }[]

Behavior:
  - Renders one block per section
  - Section label: uppercase, tracking-widest, with left accent bar
  - Grid: 3 cols desktop / 2 cols tablet / 1 col mobile
  - Shows up to 6 articles per section (slice client-side)
  - "View all →" link to /archive at bottom of each section
  - Uses existing ArticleCard component
```

#### `TrendingRail` — `src/components/TrendingRail.jsx`

```
Props:
  articles: Article[]   // top 5 from getTrending()

Behavior:
  - Numbered list (01, 02, 03, 04, 05) with large rank number in tuwa-gold
  - Each item: rank + title + date
  - Each item is a <Link href="/articles/{slug}">
  - Background: bg-tuwa-gray, distinct from section grids
  - Fallback ordering: if fewer than 5 articles have trending_velocity > 0,
    sort remaining by published_at desc (handled in page.jsx before passing props)
```

### Modified Components

#### `Navbar` — `src/components/Navbar.jsx`

Changes:
- Add a 3px red top strip (`bg-red-600 h-[3px] w-full`) above the nav row
- Accept `sections: string[]` prop for dynamic section links → `/category/[slug]`
- Add search icon button (SVG) on the right side (replaces the conditional search input)
- Add "LIVE" badge (red dot + text) — rendered when `hasBreaking` prop is true
- Existing mobile hamburger menu preserved; section links added to mobile menu

#### `ArchiveContent` — `src/components/ArchiveContent.jsx`

Changes:
- Add article count header: "N stories" derived from `archiveData.flatMap(g => g.articles).length`
- Add filter bar: year select + category select (client state, no server fetch)
- Replace timeline dot layout with table-like rows: `date | title | author | tag`
- Mobile: stacked card layout (date above title)
- "No stories found" message when filter produces empty results

#### `AboutPageContent` — `src/components/AboutPageContent.jsx`

Changes (visual only, all text preserved):
- Add full-width masthead banner at top: dark bg, large title, descriptor, `<hr>` below
- Section labels changed to `text-xs uppercase tracking-widest font-bold` (small-caps style)
- Author role displayed as a small badge pill (`border border-white/20 rounded-full px-2 py-0.5`)
- Horizontal `<hr className="border-white/10">` between masthead and body already exists — keep

#### `LegalContent` — `src/components/LegalContent.jsx`

Changes (all text preserved):
- Add masthead header block at top: "OpenTuwa Legal" in large heading + subtitle
- Body text: add `font-serif` or `leading-relaxed text-[1.0625rem]` class to `.glass-panel` content
- Effective date: styled as `text-xs uppercase tracking-widest text-tuwa-muted border-l-2 border-tuwa-accent pl-3`
- Add "Back to top" button at bottom of each policy article (scrolls to `window.scrollTo({top:0})`)
- Existing TOC, tabs, and language switcher preserved unchanged

---

## Data Models

No new database tables or columns are required. All fields used by the new components already exist in the D1 schema.

### Article (existing, relevant fields)

```typescript
interface Article {
  slug: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;   // note: homepage query returns as 'author'
  published_at: string | null;  // ISO 8601 string
  image_url: string | null;
  tags: string | null;          // comma-separated string
  section: string | null;
  category: string | null;
  read_time_minutes: number | null;
  trending_velocity: number | null;
  engagement_score: number | null;
  excerpt: string | null;
}
```

### Section Grouping (derived, client-side)

```typescript
interface SectionGroup {
  label: string;      // article.section ?? article.category ?? "General"
  articles: Article[];
}
```

The `groupBySection` utility function (to be implemented in `src/utils/sections.js`):

```javascript
export function groupBySection(articles) {
  const map = new Map();
  for (const article of articles) {
    const label = article.section?.trim() || article.category?.trim() || 'General';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(article);
  }
  return Array.from(map.entries()).map(([label, articles]) => ({ label, articles }));
}
```

### Ticker Articles (derived, server-side)

The 5 most recent articles for the ticker are derived in `page.jsx` before rendering:

```javascript
const tickerArticles = [...articles]
  .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
  .slice(0, 5);
```

### Trending Articles (derived, server-side)

The trending rail uses the first 5 items from `getTrending()` output (already sorted). If fewer than 5 have `trending_velocity > 0`, the remaining slots are filled by `published_at` desc — this is already handled by `getTrending()`'s `chronScore` fallback.

### Archive Filter State (client-side)

```typescript
interface ArchiveFilterState {
  year: string | null;      // e.g. "2024" or null for all
  category: string | null;  // e.g. "Politics" or null for all
}
```

Derived filter options are computed from `archiveData` on mount — no additional fetch.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Section grouping never loses articles

*For any* non-empty array of articles, `groupBySection(articles)` should produce groups whose total article count equals the original array length — no article is dropped or duplicated.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 2: Section label derivation priority

*For any* article, the section label assigned by `groupBySection` should equal `article.section` if non-empty, otherwise `article.category` if non-empty, otherwise `"General"`. This includes the edge case where both fields are null, empty string, or whitespace-only.

**Validates: Requirements 4.2, 4.4**

### Property 3: Trending rail ordering

*For any* array of articles passed to the trending rail, the 5 items displayed should be ordered such that no item has a lower `trending_velocity` (or `published_at` when velocity is zero) than any item not displayed. Formally: for all pairs (displayed, not-displayed), `score(displayed) >= score(not-displayed)`.

**Validates: Requirements 5.1, 5.5**

### Property 4: Trending rail fallback to published_at

*For any* article set where fewer than 5 articles have `trending_velocity > 0`, the rail ordering should be equivalent to ordering by `published_at` descending for the zero-velocity articles — the fallback must not produce an ordering that contradicts recency.

**Validates: Requirements 5.5**

### Property 5: Breaking news ticker always shows 5 most recent

*For any* array of articles with at least 5 items, the ticker should display exactly the 5 articles with the most recent `published_at` values, and no article outside that set should appear in the ticker.

**Validates: Requirements 2.1**

### Property 6: Archive year grouping correctness

*For any* article set, every article in a year group should have a `published_at` date whose `getFullYear()` equals the group's year key. No article should appear in a group for a year that does not match its publication year.

**Validates: Requirements 6.2**

### Property 7: Archive total count accuracy

*For any* archive data set, the displayed total article count should equal the sum of all articles across all year groups — i.e., `sum(group.articles.length for group in archiveData) === displayedCount`.

**Validates: Requirements 6.4**

### Property 8: Archive filter produces valid subset

*For any* filter state (year, category, or both), the set of articles displayed after filtering should be a subset of the full unfiltered article set. Additionally: if a year filter is active, every displayed article's publication year must match the filter year; if a category filter is active, every displayed article's primary tag/category must match the filter category.

**Validates: Requirements 6.6, 6.7**

### Property 9: Hero story renders all required fields

*For any* article object, the `HeroStory` component should render a non-empty string for title, and should include the article's slug in the link href. When `image_url` is null or empty, the component should render without throwing and should display a fallback background.

**Validates: Requirements 3.3, 3.7**

### Property 10: ArticleCard renders all required fields

*For any* article object with non-null title and slug, the `ArticleCard` component should render the title, and the link href should equal `/articles/{slug}`. Fields that are null (author, date, read_time) should be omitted gracefully without crashing.

**Validates: Requirements 4.6**

---

## Error Handling

### Homepage

| Scenario | Handling |
|---|---|
| `fetchCandidates` throws | Caught in existing try/catch in `page.jsx`; `articles = []`; all sub-components receive empty arrays and render gracefully |
| `articles` is empty | `BreakingNewsTicker` renders nothing; `HeroStory` renders nothing; `SectionGrid` renders nothing; `TrendingRail` renders nothing; existing "No stories found" message shown |
| Article has no `image_url` | `HeroStory` uses `bg-tuwa-gray` fallback; `ArticleCard` uses existing Unsplash fallback |
| Article has no `section` or `category` | `groupBySection` assigns to `"General"` group |
| Fewer than 5 articles | Ticker shows all available; trending rail shows all available |

### Archive

| Scenario | Handling |
|---|---|
| D1 query throws | Existing try/catch returns `[]`; `ArchiveContent` shows "No articles found" |
| Filter produces empty results | "No stories found" message rendered in place of article list |
| `published_at` is null | `new Date(null)` → epoch date; article appears in year 1970 group (acceptable edge case) |

### Navbar

| Scenario | Handling |
|---|---|
| `sections` prop is empty | Section links area renders nothing; existing static links (Stories, Archive, About) always shown |
| `hasBreaking` prop is false/undefined | Breaking badge not rendered |

### General

All new client components use defensive rendering: `article?.title`, `article?.slug` optional chaining throughout. No component throws on null/undefined article fields.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. Unit tests cover specific examples, integration points, and edge cases. Property tests verify universal correctness across randomly generated inputs.

### Property-Based Testing

**Library**: `fast-check` (already compatible with the Vitest setup in this repo).

Each property test must run a minimum of 100 iterations. Each test must include a comment referencing the design property it validates.

Tag format: `// Feature: news-homepage-redesign, Property {N}: {property_text}`

**Property test file**: `src/utils/sections.test.js` (for grouping logic) and `src/components/*.test.jsx` (for component rendering properties).

#### Property Tests to Implement

| Test | Property | Library Arbitraries |
|---|---|---|
| `groupBySection` never loses articles | Property 1 | `fc.array(fc.record({section: fc.option(fc.string()), category: fc.option(fc.string())}))` |
| `groupBySection` label derivation | Property 2 | `fc.record({section: fc.option(fc.string()), category: fc.option(fc.string())})` |
| Trending rail ordering | Property 3 | `fc.array(fc.record({trending_velocity: fc.float(), published_at: fc.date()}), {minLength: 5})` |
| Trending fallback to published_at | Property 4 | `fc.array(fc.record({trending_velocity: fc.constant(0), published_at: fc.date()}), {minLength: 5})` |
| Ticker shows 5 most recent | Property 5 | `fc.array(fc.record({published_at: fc.date().map(d => d.toISOString())}), {minLength: 5})` |
| Archive year grouping | Property 6 | `fc.array(fc.record({published_at: fc.date().map(d => d.toISOString())}))` |
| Archive count accuracy | Property 7 | `fc.array(fc.record({published_at: fc.date().map(d => d.toISOString())}))` |
| Archive filter subset | Property 8 | `fc.array(fc.record({published_at: fc.date().map(d => d.toISOString()), category: fc.string()}))` |
| HeroStory renders without crash | Property 9 | `fc.record({title: fc.string(), slug: fc.string(), image_url: fc.option(fc.string())})` |
| ArticleCard renders without crash | Property 10 | `fc.record({title: fc.string({minLength:1}), slug: fc.string({minLength:1}), author: fc.option(fc.string()), published_at: fc.option(fc.string()), read_time_minutes: fc.option(fc.integer())})` |

### Unit Tests

Unit tests focus on specific examples, integration points, and edge cases not covered by property tests.

**Unit test files**: co-located with components (`*.test.jsx`) or in `src/tests/`.

| Test | What it verifies |
|---|---|
| Navbar renders section links | Given `sections=["Politics","Culture"]`, links to `/category/politics` and `/category/culture` are rendered |
| Navbar mobile menu toggle | Hamburger click shows/hides mobile menu |
| Breaking badge visibility | `hasBreaking=true` renders badge; `hasBreaking=false` does not |
| Ticker headline links | Each ticker item href equals `/articles/{slug}` |
| Hero story link | Hero `<a>` href equals `/articles/{slug}` |
| Section grid "View all" link | href equals `/archive` |
| Trending rail item links | Each item href equals `/articles/{slug}` |
| Archive filter year | Selecting year "2023" shows only 2023 articles |
| Archive filter category | Selecting category "Politics" shows only Politics articles |
| Archive "No stories found" | Empty filter result renders the message |
| Legal tabs preserved | All three tab buttons render; switching tabs shows correct content |
| Legal TOC links | Each TOC anchor href matches the corresponding section id |
| Legal back-to-top button | Button exists in each policy article |
| About subscription form | Form renders with email input and submit button |
| About author sidebar | Each author renders name, role, and profile link |
| HeroStory null image fallback | `image_url=null` renders without crash, no `<img>` with empty src |

### Test Configuration

```javascript
// vitest.config.js — no changes needed, fast-check works with Vitest
// Run tests: vitest --run
```

Install fast-check if not already present:
```bash
npm install --save-dev fast-check
```
