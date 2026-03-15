// Shared hreflang tag builder for Cloudflare Worker bot-SSR functions
// All 13 supported locales point to the same URL (content is English-only;
// locale only affects UI labels). This is valid per Google's hreflang spec.

const LOCALES = ['en', 'zh-Hans', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'ja', 'tr', 'de'];
const SITE_URL = 'https://opentuwa.com';

/**
 * Returns a block of <link rel="alternate" hreflang="..."> tags for the given path.
 * @param {string} path - e.g. '/', '/about', '/articles/my-slug'
 * @returns {string}    - HTML string of link tags (indented for head block insertion)
 */
export function buildHreflangTags(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return LOCALES.map(locale =>
    `<link rel="alternate" hreflang="${locale}" href="${SITE_URL}${cleanPath}">`
  ).join('\n  ')
    + `\n  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${cleanPath}">`;
}
