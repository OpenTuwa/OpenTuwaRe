import { RecommendationEngine } from '../utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const currentSlug = url.searchParams.get('slug');
  const sessionId = url.searchParams.get('session_id');

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

    // 2. Fetch User Session Data (The Ghost Profile)
    // We now fetch the pre-aggregated 'lexical_history' from the consolidated session table.
    // This prevents massive database JOINS and memory leaks. 1 Session = 1 Fast Lookup.
    let userSessionMatrix = {};
    if (sessionId) {
      const sessionData = await env.DB.prepare(`
        SELECT lexical_history 
        FROM algo_user_sessions 
        WHERE session_id = ?
      `).bind(sessionId).first();

      if (sessionData && sessionData.lexical_history) {
        try {
          userSessionMatrix = JSON.parse(sessionData.lexical_history);
        } catch(e) {} // ignore parsing errors
      }
    }

    // Convert to string for the compare function if we found data
    const userMatrixStr = Object.keys(userSessionMatrix).length > 0 ? JSON.stringify(userSessionMatrix) : null;

    // 3. Fetch Candidate Articles (Latest 100 to feed the brain)
    // Delegate to The Brain's centralized data fetcher
    const results = await RecommendationEngine.fetchCandidates(env, 100, null);

    // 4. Activate The Brain
    const engine = new RecommendationEngine(results);
    
    // 5. Get Recommendations (Now passing the 3 Tiers of context)
    const recommendations = engine.getRecommended(currentArticle, 3, userMatrixStr);

    return new Response(JSON.stringify(recommendations), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
