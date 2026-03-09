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
    let userSessionMatrix = {};
    if (sessionId) {
      // Find all articles this user has read in this session
      const { results: sessionHistory } = await env.DB.prepare(`
        SELECT a.lexical_matrix
        FROM algo_interactions i
        JOIN articles a ON i.article_slug = a.slug
        WHERE i.session_id = ? AND i.action_type = 'view'
        LIMIT 20
      `).bind(sessionId).all();
      
      // Merge all matrices to form the user's current habit profile
      for (const historyItem of sessionHistory) {
        if (historyItem.lexical_matrix) {
          try {
            const matrix = JSON.parse(historyItem.lexical_matrix);
            for (const [word, count] of Object.entries(matrix)) {
              userSessionMatrix[word] = (userSessionMatrix[word] || 0) + count;
            }
          } catch(e) {} // ignore parsing errors
        }
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
