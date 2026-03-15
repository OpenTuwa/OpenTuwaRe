// Shared hreflang tag builder for Cloudflare Worker bot-SSR functions

const LOCALES = ['en', 'zh-Hans', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'ja', 'tr', 'de'];
const SITE_URL = 'https://opentuwa.com';

/**
 * Returns a block of <link rel="alternate" hreflang="..."> tags for the given path.
 *
 * For static pages (about, archive, homepage, authors, legal) pass no
 * availableTranslations — all 13 locales are emitted.
 *
 * For article pages, pass the availableTranslations array from the DB row.
 * Only locales present in that array will be emitted (plus x-default → 'en' URL).
 * 'en' is always included for articles since the canonical content is English.
 *
 * @param {string}   path                   - e.g. '/articles/my-slug'
 * @param {string[]|null} [availableTranslations] - locale codes available for this article,
 *                                                  or null/undefined for static pages
 * @returns {string} - HTML string of <link> tags
 */
export function buildHreflangTags(path = '', availableTranslations = null) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${SITE_URL}${cleanPath}`;

  // Static pages: emit all locales
  if (!availableTranslations) {
    return LOCALES.map(locale =>
      `<link rel="alternate" hreflang="${locale}" href="${url}">`
    ).join('\n  ')
      + `\n  <link rel="alternate" hreflang="x-default" href="${url}">`;
  }

  // Article pages: only emit locales that exist in the DB, always include 'en'
  const available = new Set(availableTranslations);
  available.add('en'); // English is always available (canonical content language)

  return LOCALES
    .filter(locale => available.has(locale))
    .map(locale => `<link rel="alternate" hreflang="${locale}" href="${url}">`)
    .join('\n  ')
      + `\n  <link rel="alternate" hreflang="x-default" href="${url}">`;
}

/**
 * Builds the Next.js `alternates.languages` object for generateMetadata.
 *
 * @param {string}        canonicalUrl
 * @param {string[]|null} [availableTranslations] - null for static pages (all locales)
 * @returns {Record<string, string>}
 */
export function buildHreflangLanguages(canonicalUrl, availableTranslations = null) {
  if (!availableTranslations) {
    // Static page — all locales
    const languages = Object.fromEntries(LOCALES.map(l => [l, canonicalUrl]));
    languages['x-default'] = canonicalUrl;
    return languages;
  }

  // Article page — only available locales + en
  const available = new Set(availableTranslations);
  available.add('en');

  const languages = Object.fromEntries(
    LOCALES.filter(l => available.has(l)).map(l => [l, canonicalUrl])
  );
  languages['x-default'] = canonicalUrl;
  return languages;
}
