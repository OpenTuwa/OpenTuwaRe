import { RecommendationEngine } from '../utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    
    let results = [];

    if (!q) {
      const { results: rawResults } = await env.DB.prepare(`
        SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
               COALESCE(m.engagement_score, 0) as engagement_score
        FROM articles a
        LEFT JOIN algo_metrics m ON a.slug = m.article_slug
        ORDER BY a.published_at DESC LIMIT 50
      `).all();
      results = rawResults;
    } else {
      // search across multiple fields
      const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      const sql = `
        SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
               COALESCE(m.engagement_score, 0) as engagement_score
        FROM articles a
        LEFT JOIN algo_metrics m ON a.slug = m.article_slug
        WHERE (
          a.title LIKE ? ESCAPE '\\' OR
          a.subtitle LIKE ? ESCAPE '\\' OR
          a.seo_description LIKE ? ESCAPE '\\' OR
          a.content_html LIKE ? ESCAPE '\\' OR
          a.tags LIKE ? ESCAPE '\\' OR
          a.image_url LIKE ? ESCAPE '\\' OR
          a.image_alt LIKE ? ESCAPE '\\' OR
          a.content_html LIKE ? ESCAPE '\\'
        )
        ORDER BY a.published_at DESC
        LIMIT 100
      `;
      const { results: rawResults } = await env.DB.prepare(sql).bind(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard).all();
      results = rawResults;
    }

    // Apply The Brain to standardize sorting/scoring even for the default list
    const engine = new RecommendationEngine(results);
    const finalResults = engine.getLatest(); 

    return Response.json(finalResults);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}