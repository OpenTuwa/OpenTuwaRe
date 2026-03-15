// Shared hreflang tag builder for Cloudflare Worker bot-SSR functions
//
// Static pages (about, archive, homepage, legal, authors) emit NO hreflang tags
// because OpenTuwa has no translated versions of these pages. Emitting 13 locales
// all pointing to the same English URL is malformed hreflang and will be ignored
// or penalised by Google. Re-enable when actual translated URLs exist.
//
// Article pages emit hreflang only for locales present in the article's
// available_translations DB column, plus always 'en' + 'x-default'.

import { SITE_URL } from './constants.js';

const LOCALES = ['en', 'zh-Hans', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'ja', 'tr', 'de'];

/**
 * Returns a block of <link rel="alternate" hreflang="..."> tags.
 *
 * @param {string}        path
 * @param {string[]|null} [availableTranslations] - null/omitted → static page → no tags emitted
 * @returns {string}
 */
export function buildHreflangTags(path = '', availableTranslations = null) {
  // Static pages: no translated URLs exist — emit nothing
  if (!availableTranslations) return '';

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${SITE_URL}${cleanPath}`;

  const available = new Set(availableTranslations);
  available.add('en');

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
 * @param {string[]|null} [availableTranslations] - null → static page → empty object
 * @returns {Record<string, string>}
 */
export function buildHreflangLanguages(canonicalUrl, availableTranslations = null) {
  // Static pages: no translated URLs — return empty so Next.js emits no hreflang
  if (!availableTranslations) return {};

  const available = new Set(availableTranslations);
  available.add('en');

  const languages = Object.fromEntries(
    LOCALES.filter(l => available.has(l)).map(l => [l, canonicalUrl])
  );
  languages['x-default'] = canonicalUrl;
  return languages;
}
