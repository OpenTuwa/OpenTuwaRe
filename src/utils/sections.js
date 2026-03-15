/**
 * Builds the homepage content blocks:
 *
 * Block types:
 *   { type: 'section',       label, articles }
 *   { type: 'special_issue', label, articles }  ← visually distinct
 *
 * Layout order:
 *   Latest → special (if any) → section1 → special (if any) → section2 → section3 → special (if any) → …
 *
 * Special issue segments are interleaved every ~2 regular sections so the page
 * doesn't feel monotonous. If there are fewer specials than slots, extras are skipped.
 *
 * @param {Array} articles — algorithm-ranked articles from the engine
 * @returns {Array<{ type: string, label: string, articles: Array }>}
 */
export function groupBySection(articles) {
  if (!articles || articles.length === 0) return [];

  // ── 1. Latest: chronological, max 30 ──
  const latest = [...articles]
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 30);

  // ── 2. Named sections (algorithm order, insertion-stable) ──
  const sectionMap = new Map();
  for (const article of articles) {
    const label = article.section?.trim() || article.category?.trim();
    if (!label) continue;
    if (!sectionMap.has(label)) sectionMap.set(label, []);
    sectionMap.get(label).push(article);
  }
  const namedSections = Array.from(sectionMap.entries()).map(([label, arts]) => ({
    type: 'section',
    label,
    articles: arts,
  }));

  // ── 3. Special issues (grouped by special_issue label, algorithm order) ──
  const specialMap = new Map();
  for (const article of articles) {
    const si = article.special_issue?.trim();
    if (!si) continue;
    if (!specialMap.has(si)) specialMap.set(si, []);
    specialMap.get(si).push(article);
  }
  const specials = Array.from(specialMap.entries()).map(([label, arts]) => ({
    type: 'special_issue',
    label,
    articles: arts,
  }));

  // ── 4. Interleave: insert a special every 2 regular sections ──
  const result = [{ type: 'section', label: 'Latest', articles: latest }];
  let specialIdx = 0;
  const INTERVAL = 2; // insert special after every N regular sections

  for (let i = 0; i < namedSections.length; i++) {
    // insert special before this section if we've hit the interval
    if (i > 0 && i % INTERVAL === 0 && specialIdx < specials.length) {
      result.push(specials[specialIdx++]);
    }
    result.push(namedSections[i]);
  }

  // append any remaining specials at the end
  while (specialIdx < specials.length) {
    result.push(specials[specialIdx++]);
  }

  return result;
}
