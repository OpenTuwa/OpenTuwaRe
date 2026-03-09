import { RecommendationEngine } from '../utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const currentSlug = url.searchParams.get('slug');

  if (!currentSlug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });
  }

  try {
    // 1. Fetch Current Article Context
    const currentArticle = await env.DB.prepare(`
      SELECT * FROM articles WHERE slug = ?
    `).bind(currentSlug).first();

    if (!currentArticle) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // 2. Fetch Candidate Articles (Latest 100 to feed the brain)
    // We also fetch the engagement metrics to pass to the brain
    const { results } = await env.DB.prepare(`
      SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
             COALESCE(m.engagement_score, 0) as engagement_score,
             COALESCE(m.avg_time_spent, 0) as avg_time_spent
      FROM articles a
      LEFT JOIN algo_metrics m ON a.slug = m.article_slug
      ORDER BY a.published_at DESC
      LIMIT 100
    `).all();

    // 3. Activate The Brain
    const engine = new RecommendationEngine(results);
    
    // 4. Get Recommendations
    const recommendations = engine.getRecommended(currentArticle, 3);

    return new Response(JSON.stringify(recommendations), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
