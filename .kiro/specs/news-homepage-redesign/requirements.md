# Requirements Document

## Introduction

OpenTuwa is an independent news and media platform built on Next.js + Cloudflare Workers (Pages Functions) with a D1 SQLite database. The current homepage, archive, legal, and about pages have a blog-style aesthetic. This feature redesigns those four pages to match the visual language and UX conventions of professional news outlets (BBC, Reuters, AP, Al Jazeera) — without dismantling existing functionality, data fetching, or the article page's hybrid approach.

The redesign covers:
- **Homepage** — hero story, breaking news ticker, section grids, trending sidebar
- **Archive page** — professional news-style chronological index
- **Legal page** — clean, authoritative legal document layout
- **About page** — visual design only; existing text/content must not change

---

## Glossary

- **Homepage**: The root `/` page rendered by `src/app/(site)/page.jsx` and `src/components/ArticleCard.jsx`
- **Archive_Page**: The `/archive` page rendered by `src/app/(site)/archive/page.jsx` and `src/components/ArchiveContent.jsx`
- **Legal_Page**: The `/legal` page rendered by `src/components/LegalContent.jsx`
- **About_Page**: The `/about` page rendered by `src/components/AboutPageContent.jsx`
- **Navbar**: The site-wide navigation component at `src/components/Navbar.jsx`
- **Footer**: The site-wide footer component at `src/components/Footer.jsx`
- **ArticleCard**: The card component at `src/components/ArticleCard.jsx` used on the homepage
- **Hero_Story**: The primary featured article displayed prominently at the top of the homepage
- **Breaking_News_Ticker**: A horizontally scrolling banner displaying the most recent article headlines
- **Section_Grid**: A grouped display of articles by category/section (e.g., Politics, Culture, Analysis)
- **Trending_Rail**: A ranked list of articles ordered by engagement/trending score
- **RecommendationEngine**: The existing algorithm in `src/utils/algorithm.js` that scores and ranks articles
- **D1_Database**: The Cloudflare D1 SQLite database containing `articles`, `authors`, and `algo_user_sessions` tables
- **Bot_Renderer**: The Cloudflare Pages Function (e.g., `functions/index.js`) that serves static HTML to crawlers
- **design_tokens**: The Tailwind CSS color/font variables defined in `tailwind.config.cjs` (tuwa-black, tuwa-gray, tuwa-text, tuwa-muted, tuwa-accent, tuwa-gold)

---

## Requirements

### Requirement 1: Professional News Navbar

**User Story:** As a reader, I want a navigation bar that looks and functions like a professional news outlet, so that I immediately recognise the site as a credible news source.

#### Acceptance Criteria

1. THE Navbar SHALL display the site logo/wordmark on the left, primary section links in the center, and a search icon on the right.
2. WHEN the viewport width is below 768px, THE Navbar SHALL collapse section links into a hamburger menu.
3. THE Navbar SHALL display a thin red or accent-colored top border strip (the "news bar") above the main nav row, consistent with BBC/Al Jazeera style.
4. WHEN a user hovers over a section link, THE Navbar SHALL display a visible underline or highlight transition.
5. THE Navbar SHALL remain fixed at the top of the viewport during scroll.
6. THE Navbar SHALL include a "Live" or "Breaking" indicator badge that is visible when breaking news articles exist.

---

### Requirement 2: Breaking News Ticker

**User Story:** As a reader, I want to see a scrolling ticker of the latest headlines, so that I can quickly scan what is happening without scrolling the page.

#### Acceptance Criteria

1. THE Breaking_News_Ticker SHALL display the 5 most recently published article titles as horizontally auto-scrolling text.
2. THE Breaking_News_Ticker SHALL be positioned directly below the Navbar.
3. WHEN a user clicks a headline in the Breaking_News_Ticker, THE Breaking_News_Ticker SHALL navigate the user to the corresponding article page.
4. THE Breaking_News_Ticker SHALL include a "LATEST" or "BREAKING" label prefix styled in a contrasting color (e.g., red).
5. WHEN the Breaking_News_Ticker reaches the end of the headline list, THE Breaking_News_Ticker SHALL loop back to the first headline seamlessly.
6. THE Breaking_News_Ticker SHALL pause scrolling when the user hovers over it.

---

### Requirement 3: Homepage Hero Story

**User Story:** As a reader, I want a large featured story at the top of the homepage, so that the most important or latest article is immediately visible and prominent.

#### Acceptance Criteria

1. THE Homepage SHALL display a Hero_Story as the first visual element below the Breaking_News_Ticker.
2. THE Hero_Story SHALL use the first article returned by the RecommendationEngine (highest trending score) as its content.
3. THE Hero_Story SHALL display the article's `image_url`, `title`, `subtitle`, `author_name`, `published_at`, and primary tag.
4. THE Hero_Story SHALL occupy the full width of the content area on desktop and stack vertically on mobile.
5. WHEN a user clicks the Hero_Story, THE Homepage SHALL navigate to the corresponding article page.
6. THE Hero_Story image SHALL have a dark gradient overlay so that text overlaid on the image remains legible at all viewport sizes.
7. IF the Hero_Story article has no `image_url`, THEN THE Hero_Story SHALL display a solid dark fallback background without breaking layout.

---

### Requirement 4: Homepage Section Grids

**User Story:** As a reader, I want articles grouped by topic section, so that I can quickly navigate to the type of content I am interested in.

#### Acceptance Criteria

1. THE Homepage SHALL display at least two Section_Grid blocks below the Hero_Story.
2. EACH Section_Grid SHALL display a section label (derived from the article's `section` or `category` field) as a heading.
3. EACH Section_Grid SHALL display between 3 and 6 articles in a responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile).
4. WHEN the `section` and `category` fields are both null or empty for an article, THE Homepage SHALL assign that article to a default "General" section.
5. THE Homepage SHALL display a "More stories" or "View all" link at the bottom of each Section_Grid that navigates to the Archive_Page.
6. THE ArticleCard within a Section_Grid SHALL display the article image, title, author, date, and read time.

---

### Requirement 5: Homepage Trending Rail

**User Story:** As a reader, I want to see a ranked list of trending articles, so that I can discover what other readers are engaging with most.

#### Acceptance Criteria

1. THE Homepage SHALL display a Trending_Rail as a sidebar or horizontal strip showing the top 5 articles by `trending_velocity` or `engagement_score`.
2. EACH item in the Trending_Rail SHALL display a rank number, article title, and publication date.
3. WHEN a user clicks a Trending_Rail item, THE Homepage SHALL navigate to the corresponding article page.
4. THE Trending_Rail SHALL be visually distinct from the Section_Grid (e.g., numbered list, different background).
5. IF fewer than 5 articles have a non-zero `trending_velocity`, THEN THE Trending_Rail SHALL fall back to ordering by `published_at` descending.

---

### Requirement 6: Professional Archive Page

**User Story:** As a reader, I want the archive page to look like a professional news index, so that I can browse the full article history in a structured, readable format.

#### Acceptance Criteria

1. THE Archive_Page SHALL display a page header with the title "Archive" and a brief descriptor line.
2. THE Archive_Page SHALL group articles by year, with each year displayed as a section heading.
3. WITHIN each year section, THE Archive_Page SHALL display articles in a table-like row layout showing: publication date (month/day), article title as a link, author name, and primary tag/category.
4. THE Archive_Page SHALL display a total article count in the page header (e.g., "247 stories").
5. WHEN a user clicks an article title in the Archive_Page, THE Archive_Page SHALL navigate to the corresponding article page.
6. THE Archive_Page SHALL include a filter bar allowing users to filter by year or category without a full page reload.
7. WHEN no articles match the active filter, THE Archive_Page SHALL display a "No stories found" message.

---

### Requirement 7: Professional Legal Page

**User Story:** As a reader or legal reviewer, I want the legal page to look like a professional legal document page, so that the content is easy to read and the site appears credible.

#### Acceptance Criteria

1. THE Legal_Page SHALL retain all existing tab navigation (End User Agreement, Privacy Policy, Cookie Policy) and all existing legal text without modification.
2. THE Legal_Page SHALL display a clean masthead at the top with the site name and "Legal" label, styled consistently with the rest of the site.
3. THE Legal_Page SHALL use a two-column layout on desktop: a sticky table-of-contents sidebar on the left and the document content on the right.
4. THE Legal_Page SHALL use a serif or semi-serif body font for the legal document text to improve readability and convey authority.
5. THE Legal_Page SHALL display the effective date of each policy in a clearly styled metadata line below the document title.
6. WHEN a user clicks a table-of-contents entry, THE Legal_Page SHALL smoothly scroll to the corresponding section.
7. THE Legal_Page SHALL include a "Back to top" affordance at the bottom of each policy document.

---

### Requirement 8: About Page Visual Redesign

**User Story:** As a reader, I want the about page to look like a professional news outlet's "About Us" page, so that the platform's credibility and identity are clearly communicated.

#### Acceptance Criteria

1. THE About_Page SHALL preserve all existing text content, author data, and the email subscription form without modification.
2. THE About_Page SHALL display a full-width masthead banner at the top with the page title and a short descriptor, styled like a news section header.
3. THE About_Page SHALL use a two-column layout on desktop: main editorial content on the left and the contributors sidebar on the right.
4. THE About_Page SHALL display each author in the contributors sidebar with their avatar, name, role badge, and a link to their articles.
5. THE About_Page SHALL use consistent typographic hierarchy (section labels in small-caps uppercase, body text in readable line-height) matching the news outlet aesthetic.
6. THE About_Page SHALL display a horizontal rule or visual divider between the masthead and the body content.

---

### Requirement 9: Responsive Design Across All Pages

**User Story:** As a reader on any device, I want all redesigned pages to be fully usable on mobile, tablet, and desktop, so that the experience is consistent regardless of screen size.

#### Acceptance Criteria

1. THE Homepage SHALL reflow from a multi-column layout to a single-column layout at viewport widths below 768px.
2. THE Archive_Page SHALL reflow the article row layout to a stacked card layout at viewport widths below 768px.
3. THE Legal_Page SHALL collapse the two-column layout to a single-column layout at viewport widths below 768px, with the table of contents appearing above the document content.
4. THE About_Page SHALL collapse the two-column layout to a single-column layout at viewport widths below 768px.
5. THE Breaking_News_Ticker SHALL remain functional and legible at all viewport widths.

---

### Requirement 10: Preserve Existing Functionality

**User Story:** As a developer, I want all existing data fetching, SEO, bot rendering, and algorithm logic to remain intact, so that the redesign does not break any current features.

#### Acceptance Criteria

1. THE Homepage SHALL continue to use the RecommendationEngine and `fetchCandidates` from `src/utils/algorithm.js` to source all article data.
2. THE Bot_Renderer functions (`functions/index.js`, `functions/archive.js`, `functions/about.js`, `functions/legal.js`) SHALL continue to serve correct HTML to search engine crawlers without modification to their SEO logic.
3. THE Homepage SHALL preserve all existing `generateMetadata` output including canonical URLs, Open Graph tags, and robots directives.
4. THE Archive_Page SHALL continue to query the D1_Database using the existing SQL in `src/app/(site)/archive/page.jsx`.
5. THE About_Page SHALL continue to fetch author data from the D1_Database using the existing query in `src/app/(site)/about/page.jsx`.
6. THE Article_Page (`src/app/(site)/articles/[slug]/page.jsx`) SHALL NOT be modified as part of this redesign.
7. IF any redesigned component introduces a new client-side data fetch, THEN THE component SHALL handle loading and error states gracefully without crashing the page.
