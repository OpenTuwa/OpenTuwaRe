/**
 * Builds the homepage section list:
 * 1. "Latest" — 30 most recently published articles (chronological)
 * 2. Named sections — articles grouped by section/category, in order of first appearance
 *
 * Articles with no section/category are skipped from named sections
 * (they already appear in Latest).
 *
 * @param {Array} articles — already algorithm-ranked from the engine
 * @returns {{ label: string, articles: Array }[]}
 */
export function groupBySection(articles) {
  if (!articles || articles.length === 0) return [];

  // ── 1. Latest: sort all by published_at desc, cap at 30 ──
  const latest = [...articles]
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 30);

  // ── 2. Named sections: group by section → category, preserve insertion order ──
  const map = new Map();
  for (const article of articles) {
    const label = article.section?.trim() || article.category?.trim();
    if (!label) continue; // skip uncategorised — they're in Latest
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(article);
  }

  const namedSections = Array.from(map.entries()).map(([label, arts]) => ({
    label,
    articles: arts,
  }));

  return [
    { label: 'Latest', articles: latest },
    ...namedSections,
  ];
}
