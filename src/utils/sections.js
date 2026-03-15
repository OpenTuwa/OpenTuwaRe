/**
 * Groups an array of articles by section label.
 * Priority: article.section → article.category → "General"
 * @param {Array} articles
 * @returns {{ label: string, articles: Array }[]}
 */
export function groupBySection(articles) {
  const map = new Map();
  for (const article of articles) {
    const label = article.section?.trim() || article.category?.trim() || 'General';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(article);
  }
  return Array.from(map.entries()).map(([label, articles]) => ({ label, articles }));
}
