// Feature: seo-infrastructure
// Single GraphSchema component — emits one <script type="application/ld+json"> @graph block per page.
// Replaces: NewsArticleSchema, OrganizationSchema, WebSiteSchema, BreadcrumbSchema, CollectionPageSchema

const SITE_URL = 'https://opentuwa.com';
const SITE_NAME = 'OpenTuwa';
const LOGO_URL = 'https://opentuwa.com/assets/ui/web_512.png';

// ─── Shared org node ─────────────────────────────────────────────────────────

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
  sameAs: ['https://twitter.com/opentuwa'],
};

// ─── Helpers (mirrors functions/_utils/schema.js) ────────────────────────────

function safeIso(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function resolveModified(published_at, updated_at) {
  const pub = safeIso(published_at);
  if (!pub) return null;
  const mod = safeIso(updated_at);
  if (!mod || mod < pub) return pub;
  return mod;
}

function resolveImageUrl(image_url) {
  if (!image_url) return '';
  if (image_url.startsWith('http://') || image_url.startsWith('https://')) return image_url;
  const path = image_url.startsWith('/') ? image_url : `/${image_url}`;
  return `${SITE_URL}${path}`;
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  const str = String(tags).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch (_) {}
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

function authorSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ─── Graph builders ───────────────────────────────────────────────────────────

export function buildArticleGraph(article, origin = SITE_URL) {
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

  const articleNode = {
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#article`,
    headline: title,
    description: desc,
    ...(imageAbsolute ? {
      image: { '@type': 'ImageObject', url: imageAbsolute, width: 1200, height: 630 },
    } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: { '@id': `${base}/authors/${aSlug}#person` },
    publisher: { '@id': `${base}/#organization` },
    mainEntityOfPage: { '@id': articleUrl },
    ...(keywords ? { keywords } : {}),
    ...(article.section ? { articleSection: article.section } : {}),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };

  const personNode = {
    '@type': 'Person',
    '@id': `${base}/authors/${aSlug}#person`,
    name: authorName,
    jobTitle: 'Journalist',
    url: `${base}/?author=${encodeURIComponent(authorName)}`,
  };

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: base },
    ...(article.section
      ? [{ '@type': 'ListItem', position: 2, name: article.section, item: `${base}/archive` }]
      : [{ '@type': 'ListItem', position: 2, name: 'Archive', item: `${base}/archive` }]),
    { '@type': 'ListItem', position: 3, name: title, item: articleUrl },
  ];

  const breadcrumbNode = { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems };

  return [articleNode, personNode, ORG_NODE, breadcrumbNode];
}

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
      target: { '@type': 'EntryPoint', urlTemplate: `${base}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: base }],
  };

  return [websiteNode, ORG_NODE, breadcrumbNode];
}

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

function buildAboutGraph(origin = SITE_URL) {
  const base = origin || SITE_URL;
  const aboutUrl = `${base}/about`;

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'About', item: aboutUrl },
    ],
  };

  return [ORG_NODE, breadcrumbNode];
}

function buildLegalGraph(origin = SITE_URL) {
  const base = origin || SITE_URL;
  const legalUrl = `${base}/legal`;

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Legal', item: legalUrl },
    ],
  };

  return [ORG_NODE, breadcrumbNode];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Emits a single <script type="application/ld+json"> block with a full @graph array.
 *
 * @param {'article'|'homepage'|'archive'|'about'|'legal'} type
 * @param {object} [data] - article object (required for type="article")
 */
export default function GraphSchema({ type, data }) {
  let graph;

  switch (type) {
    case 'article':
      graph = buildArticleGraph(data || {});
      break;
    case 'archive':
      graph = buildArchiveGraph();
      break;
    case 'about':
      graph = buildAboutGraph();
      break;
    case 'legal':
      graph = buildLegalGraph();
      break;
    case 'homepage':
    default:
      graph = buildHomepageGraph();
      break;
  }

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
