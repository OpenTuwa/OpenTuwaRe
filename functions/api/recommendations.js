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
    // Delegate to The Brain's centralized data fetcher
    const results = await RecommendationEngine.fetchCandidates(env, 100, null);

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
