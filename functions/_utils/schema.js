// Shared JSON-LD @graph schema builder utility for OpenTuwa
// Used by both Cloudflare Worker bot-SSR and React StructuredData components

import { SITE_URL, SITE_NAME, LOGO_URL } from './constants.js';

// ─── Shared nodes ────────────────────────────────────────────────────────────

const ORG_NODE = {
  '@type': 'NewsMediaOrganization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: LOGO_URL,
    width: 512,
    height: 512,
  },
  foundingDate: '2024',
  areaServed: 'Worldwide',
  ethicsPolicy: 'https://opentuwa.com/legal#ethics',
  masthead: 'https://opentuwa.com/about#team',
  correctionsPolicy: 'https://opentuwa.com/legal#corrections',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'newsroom',
    email: 'founder@opentuwa.com',
    availableLanguage: ['English'],
  },
  sameAs: [
    'https://twitter.com/opentuwa',
    'https://x.com/opentuwa',
    'https://www.linkedin.com/company/opentuwa',
    'https://www.youtube.com/@opentuwa',
    'https://www.facebook.com/opentuwa',
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns an ISO-8601 string if the value is a valid, parseable date.
 * Returns null if missing or unparseable (never emits "Invalid Date").
 */
function safeIso(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Guards dateModified: if updated_at is missing or earlier than published_at,
 * falls back to published_at.
 */
function resolveModified(published_at, updated_at) {
  const pub = safeIso(published_at);
  if (!pub) return null; // no valid published date — omit both
  const mod = safeIso(updated_at);
  if (!mod || mod < pub) return pub;
  return mod;
}

/**
 * Resolves a potentially relative image_url to an absolute URL.
 * Returns empty string if image_url is falsy.
 */
function resolveImageUrl(image_url) {
  if (!image_url) return '';
  if (image_url.startsWith('http://') || image_url.startsWith('https://')) {
    return image_url;
  }
  // relative path — prepend site origin
  const path = image_url.startsWith('/') ? image_url : `/${image_url}`;
  return `${SITE_URL}${path}`;
}

/**
 * Parses tags defensively: tries JSON.parse first, falls back to CSV split.
 * Returns an array of non-empty strings, or empty array.
 */
function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  const str = String(tags).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch (_) {
    // fall through to CSV
  }
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Slugifies an author name for use in @id URIs.
 * e.g. "John Doe" → "john-doe"
 */
function authorSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Builds a Schema.org Person node with enriched fields.
 *
 * @param {object} opts
 * @param {string}   opts.id          - Full @id URI for the person
 * @param {string}   opts.name        - Author display name
 * @param {string}   opts.url         - Author page URL
 * @param {string}   opts.orgId       - @id of the publisher org node
 * @param {string}   [opts.bio]       - Author bio / description
 * @param {string}   [opts.image]     - Author avatar URL
 * @param {string}   [opts.twitter]
 * @param {string}   [opts.linkedin]
 * @param {string}   [opts.facebook]
 * @param {string}   [opts.youtube]
 * @param {string}   [opts.signal]    - Signal.me invite URL (https://signal.me/#eu/...)
 * @param {string[]} [opts.knowsAbout] - Topics derived from article category / tags
 * @returns {object} Schema.org Person node
 */
function buildPersonNode({ id, name, url, orgId, bio, image, twitter, linkedin, facebook, youtube, signal, knowsAbout }) {
  const sameAsLinks = [
    twitter  ? `https://twitter.com/${twitter.replace('@', '')}` : null,
    linkedin ?? null,
    facebook ?? null,
    youtube  ?? null,
  ].filter(Boolean);

  return {
    '@type': 'Person',
    '@id': id,
    name: name || '',
    jobTitle: 'Journalist',
    url,
    knowsLanguage: ['en-US'],
    nationality: { '@type': 'Country', name: 'Malaysia' },
    worksFor: { '@id': orgId },
    ...(bio   ? { description: bio } : {}),
    ...(image ? { image: { '@type': 'ImageObject', url: image } } : {}),
    ...(signal ? { contactPoint: { '@type': 'ContactPoint', contactType: 'messaging', url: signal } } : {}),
    ...(knowsAbout?.length ? { knowsAbout } : {}),
    ...(sameAsLinks.length ? { sameAs: sameAsLinks } : {}),
  };
}

// ─── Graph builders ───────────────────────────────────────────────────────────

/**
 * Builds the JSON-LD @graph array for an article page.
 *
 * @param {object}   article       - DB row
 * @param {string}   [origin]      - Site origin (defaults to SITE_URL)
 * @param {string[]} [relatedLinks] - Absolute URLs of silo-related articles
 * @returns {object[]}             - @graph array
 */
export function buildArticleGraph(article, origin = SITE_URL, relatedLinks = []) {
  const base = origin || SITE_URL;
  const slug = article.slug || '';
  const articleUrl = `${base}/articles/${slug}`;
  const title = article.title || '';
  const desc = article.seo_description || article.subtitle || article.excerpt || title;
  const authorName = article.author || article.author_name || SITE_NAME;
  const aSlug = authorSlug(authorName);

  const datePublished = safeIso(article.published_at);
  const dateModified = resolveModified(article.published_at, article.updated_at);

  const imageAbsolute = resolveImageUrl(article.image_url);
  const tagsArray = parseTags(article.tags);
  const keywords = tagsArray.length > 0 ? tagsArray.join(', ') : null;

  // Rich ImageObject — only emit when we have a real image (not the fallback logo)
  const imageObject = imageAbsolute && imageAbsolute !== LOGO_URL
    ? {
        '@type': 'ImageObject',
        url: imageAbsolute,
        width: 1200,
        height: 630,
        caption: article?.image_alt || title || '',
        description: article?.image_alt || title || '',
        representativeOfPage: true,
      }
    : null;

  // Citation extraction — parse external hrefs from article.content_html
  const citations = [];
  if (article?.content_html) {
    const hrefRegex = /href="([^"]+)"/g;
    let match;
    const seen = new Set();
    while ((match = hrefRegex.exec(article.content_html)) !== null) {
      const url = match[1];
      if (!url.includes('opentuwa.com') && !seen.has(url)) {
        seen.add(url);
        citations.push({ '@type': 'CreativeWork', url });
      }
    }
  }

  // Article type — LiveBlogPosting for breaking news, NewsArticle otherwise
  const isBreaking = !!article?.is_breaking;
  const coverageStart = safeIso(article?.created_at);
  const coverageEnd   = safeIso(article?.updated_at);
  const liveBlogUpdate = isBreaking && title
    ? {
        '@type': 'BlogPosting',
        headline: title,
        ...(safeIso(article?.updated_at) ? { datePublished: safeIso(article.updated_at) } : {}),
      }
    : null;

  // NewsArticle / LiveBlogPosting node
  const articleNode = {
    '@type': isBreaking ? 'LiveBlogPosting' : 'NewsArticle',
    '@id': `${articleUrl}#article`,
    headline: title,
    description: desc,
    ...(imageObject ? { image: imageObject } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(isBreaking && coverageStart ? { coverageStartTime: coverageStart } : {}),
    ...(isBreaking && coverageEnd   ? { coverageEndTime: coverageEnd } : {}),
    ...(liveBlogUpdate ? { liveBlogUpdate } : {}),
    author: { '@id': `${base}/authors/${aSlug}#person` },
    publisher: { '@id': `${base}/#organization` },
    mainEntityOfPage: { '@id': articleUrl },
    ...(keywords ? { keywords } : {}),
    ...(article?.section ? { articleSection: article.section } : {}),
    ...(article?.special_issue ? {
      about: { '@type': 'Thing', name: article.special_issue },
    } : {}),
    ...(citations.length > 0 ? { citation: citations } : {}),
    ...(relatedLinks?.length ? { relatedLink: relatedLinks } : {}),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };

  // Person (author) node — enriched with DB fields when available
  const authorData = article?._author ?? {};
  const personNode = buildPersonNode({
    id: `${base}/authors/${aSlug}#person`,
    name: authorName,
    url: `${base}/authors/${aSlug}`,
    orgId: `${base}/#organization`,
    bio: authorData?.author_bio,
    image: authorData?.author_image,
    twitter: authorData?.author_twitter,
    linkedin: authorData?.author_linkedin,
    facebook: authorData?.author_facebook,
    youtube: authorData?.author_youtube,
    signal: authorData?.author_signal || null,
    knowsAbout: article?.section ? [article.section] : undefined,
  });

  // BreadcrumbList node — 3-tier: Home > Category > Article
  // Omit a tier entirely rather than emit a broken URL
  const safeCategory     = article?.category || article?.section || null;
  const safeCategorySlug = article?.category_slug || null;
  const safeTitle        = article?.title || 'Article';
  const safeSlug         = article?.slug || null;

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: base },
    ...(safeCategorySlug
      ? [{ '@type': 'ListItem', position: 2, name: safeCategory || safeCategorySlug, item: `${base}/category/${safeCategorySlug}` }]
      : []),
    ...(safeSlug
      ? [{ '@type': 'ListItem', position: safeCategorySlug ? 3 : 2, name: safeTitle, item: `${base}/articles/${safeSlug}` }]
      : []),
  ];

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return [articleNode, personNode, ORG_NODE, breadcrumbNode];
}

/**
 * Builds the JSON-LD @graph array for the homepage.
 *
 * @param {string} [origin] - Site origin (defaults to SITE_URL)
 * @returns {object[]}      - @graph array
 */
export function buildHomepageGraph(origin = SITE_URL) {
  const base = origin || SITE_URL;

  const websiteNode = {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: SITE_NAME,
    url: base,
    description: 'Independent news and journalism covering stories that matter.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
    ],
  };

  return [websiteNode, ORG_NODE, breadcrumbNode];
}

/**
 * Builds the JSON-LD @graph array for the archive page.
 *
 * @param {string} [origin] - Site origin (defaults to SITE_URL)
 * @returns {object[]}      - @graph array
 */
export function buildArchiveGraph(origin = SITE_URL) {
  const base = origin || SITE_URL;
  const archiveUrl = `${base}/archive`;

  const collectionNode = {
    '@type': 'CollectionPage',
    '@id': `${archiveUrl}#collection`,
    name: `${SITE_NAME} Archive`,
    description: 'Browse all articles and stories published on OpenTuwa.',
    url: archiveUrl,
    publisher: { '@id': `${base}/#organization` },
    inLanguage: 'en-US',
  };

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Archive', item: archiveUrl },
    ],
  };

  return [collectionNode, ORG_NODE, breadcrumbNode];
}

/**
 * Builds the JSON-LD @graph array for the About page.
 *
 * @param {string} [origin] - Site origin (defaults to SITE_URL)
 * @returns {object[]}      - @graph array
 */
export function buildAboutGraph(origin = SITE_URL) {
  const base = origin || SITE_URL;
  const aboutUrl = `${base}/about`;

  const aboutNode = {
    '@type': 'AboutPage',
    '@id': `${aboutUrl}#page`,
    name: 'About OpenTuwa',
    description: 'Independent news and journalism platform.',
    url: aboutUrl,
    publisher: { '@id': `${base}/#organization` },
    inLanguage: 'en-US',
  };

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'About', item: aboutUrl },
    ],
  };

  return [aboutNode, ORG_NODE, breadcrumbNode];
}

/**
 * Builds the JSON-LD @graph array for an author page.
 *
 * @param {object} author         - Author DB row (name, author_bio, author_image, author_twitter, etc.)
 * @param {string} authorSlugStr  - URL-safe slug for the author
 * @param {string} [origin]       - Site origin (defaults to SITE_URL)
 * @returns {object[]}            - @graph array
 */
export function buildAuthorGraph(author, authorSlugStr, origin = SITE_URL) {
  const base = origin || SITE_URL;
  const authorUrl = `${base}/authors/${authorSlugStr}`;

  const personNode = buildPersonNode({
    id: `${authorUrl}#person`,
    name: author?.name ?? '',
    url: authorUrl,
    orgId: `${base}/#organization`,
    bio: author?.author_bio || author?._bio,
    image: author?.author_image || author?._image,
    twitter: author?.author_twitter,
    linkedin: author?.author_linkedin,
    facebook: author?.author_facebook,
    youtube: author?.author_youtube,
    signal: author?.author_signal || null,
  });

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Authors', item: `${base}/authors` },
      { '@type': 'ListItem', position: 3, name: author.name, item: authorUrl },
    ],
  };

  return [personNode, ORG_NODE, breadcrumbNode];
}
