// Shared <head> builder for all Cloudflare Worker bot-SSR functions.
// Produces an optimally-ordered head block:
//   1. charset
//   2. title / description / canonical  ← crawlers read these first
//   3. viewport + theme-color
//   4. robots + hreflang
//   5. icons
//   6. OG / Twitter
//   7. RSS alternate
//   8. JSON-LD
//   9. Critical inline CSS (above-the-fold styles — nav + first ~1000px)
//  10. Cookiebot (async, non-blocking)

const COOKIEBOT_ID = '87b34ddf-45f5-47fc-8a13-87fcb9d1aa85';
const FEED_URL     = 'https://opentuwa.com/feed.xml';
const SITE_NAME    = 'OpenTuwa';

// ─── Critical CSS ─────────────────────────────────────────────────────────────
// Covers: CSS custom properties, reset, body, nav (always above fold),
// h1, hero image, article meta block, and the first paragraph — everything
// visible in the first ~1000px for both desktop and mobile.

const CRITICAL_CSS_BASE = `
:root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#c4c4c4;--accent:#3b82f6;--border:#222}
*{box-sizing:border-box}
html{background:var(--bg)}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.6;margin:0;padding:0}
a{color:var(--accent)}
nav{padding:1rem 2rem;border-bottom:1px solid var(--border)}
nav a.brand{color:#fff;font-weight:700;text-decoration:none;font-size:1.25rem}
nav a.secondary{color:var(--muted);font-size:.9rem;font-weight:400;text-decoration:none;margin-left:1.5rem}
footer{padding:2rem;font-size:.8rem;color:var(--muted);border-top:1px solid var(--border);margin-top:4rem}
footer a{color:var(--muted);text-decoration:none}
`.trim();

const CRITICAL_CSS_ARTICLE = `
.article-wrap{max-width:700px;margin:0 auto;padding:2rem}
h1{color:#fff;font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.2;margin:1.5rem 0 .5rem}
.article-meta{color:var(--muted);font-size:.9rem;padding-bottom:1rem;border-bottom:1px solid var(--border);margin-bottom:1.5rem}
.article-meta strong{color:var(--text)}
.hero-img{width:100%;height:auto;border-radius:6px;margin-bottom:1.5rem;display:block}
p{margin:0 0 1.5rem;font-size:1.05rem;line-height:1.8}
h2{color:#fff;font-size:1.5rem;margin:2rem 0 .75rem}
h3{color:#fff;font-size:1.2rem;margin:1.5rem 0 .5rem}
blockquote{border-left:3px solid var(--border);padding-left:1rem;color:var(--muted);margin:1.5rem 0}
img{max-width:100%;height:auto;border-radius:6px}
`.trim();

const CRITICAL_CSS_LIST = `
.list-wrap{max-width:800px;margin:0 auto;padding:2rem}
h1{color:#fff;font-size:clamp(1.5rem,3vw,2rem);margin:1.5rem 0 1rem}
.card{padding-bottom:1.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--border)}
.card h3{margin:0 0 .35rem;font-size:1.1rem}
.card h3 a{color:#fff;text-decoration:none}
.card h3 a:hover{color:var(--accent)}
.card p{color:var(--muted);font-size:.9rem;margin:.25rem 0}
.card .meta{font-size:.8rem;color:var(--muted);margin-top:.25rem}
.lead{font-size:1.1rem;color:var(--muted);margin-bottom:1.5rem}
hr{border:0;border-top:1px solid var(--border);margin:1.5rem 0}
`.trim();

const CRITICAL_CSS_AUTHOR = `
.author-wrap{max-width:700px;margin:0 auto;padding:2rem}
.avatar{border-radius:50%;width:80px;height:80px;object-fit:cover;display:block;margin-bottom:1rem}
h1{color:#fff;font-size:1.75rem;margin:0 0 .5rem}
.bio{color:var(--muted);margin-bottom:1.5rem;font-size:1rem}
h2{color:#fff;font-size:1.1rem;margin:2rem 0 .75rem}
ul{padding-left:1.5rem;margin:0}
li{margin-bottom:.6rem}
li a{color:var(--accent)}
.meta{font-size:.8rem;color:var(--muted);margin-left:.5rem}
`.trim();

// ─── Icon block (shared) ──────────────────────────────────────────────────────

const ICON_TAGS = `
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/ui/web_512.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/ui/web_512.png">
  <link rel="apple-touch-icon" href="/assets/ui/web_512.png">`.trimStart();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds the full <head> block for an article bot-SSR page.
 *
 * @param {object} opts
 * @param {string}  opts.title
 * @param {string}  opts.desc
 * @param {string}  opts.canonical
 * @param {string}  opts.robots
 * @param {string}  opts.hreflang       - pre-rendered hreflang link tags string
 * @param {string}  opts.ogType
 * @param {string}  opts.ogImage
 * @param {string}  opts.ogImageWidth
 * @param {string}  opts.ogImageHeight
 * @param {string}  [opts.ogImageAlt]
 * @param {string}  [opts.twitterCard]
 * @param {string}  [opts.twitterCreator]
 * @param {string}  opts.jsonLd         - serialised JSON-LD string
 * @param {string}  [opts.extraMeta]    - any extra <meta> tags (article:* etc.)
 * @param {'article'|'list'|'author'|'base'} [opts.cssVariant]
 * @returns {string}
 */
export function buildHead({
  title,
  desc,
  canonical,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1',
  hreflang = '',
  ogType = 'website',
  ogImage,
  ogImageWidth = '512',
  ogImageHeight = '512',
  ogImageAlt = '',
  twitterCard = 'summary_large_image',
  twitterCreator = '@opentuwa',
  jsonLd = '',
  extraMeta = '',
  cssVariant = 'base',
}) {
  const criticalCss = [
    CRITICAL_CSS_BASE,
    cssVariant === 'article' ? CRITICAL_CSS_ARTICLE
      : cssVariant === 'list'   ? CRITICAL_CSS_LIST
      : cssVariant === 'author' ? CRITICAL_CSS_AUTHOR
      : '',
  ].filter(Boolean).join('\n');

  return `
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0a0b">
  <meta name="robots" content="${robots}">
  ${hreflang}
  ${ICON_TAGS}
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="${ogImageWidth}">
  <meta property="og:image:height" content="${ogImageHeight}">
  ${ogImageAlt ? `<meta property="og:image:alt" content="${ogImageAlt}">` : ''}
  <meta name="twitter:card" content="${twitterCard}">
  <meta name="twitter:site" content="@opentuwa">
  ${twitterCreator !== '@opentuwa' ? `<meta name="twitter:creator" content="${twitterCreator}">` : ''}
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImage}">
  ${ogImageAlt ? `<meta name="twitter:image:alt" content="${ogImageAlt}">` : ''}
  <link rel="alternate" type="application/rss+xml" title="${SITE_NAME} RSS Feed" href="${FEED_URL}">
  ${extraMeta}
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  <style>${criticalCss}</style>
  <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="${COOKIEBOT_ID}" type="text/javascript" async></script>
`.trimStart();
}
