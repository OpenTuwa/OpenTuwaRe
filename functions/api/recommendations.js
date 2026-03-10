import { RecommendationEngine, fetchCandidates } from '../_utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const currentSlug = url.searchParams.get('slug');
  const sessionId = url.searchParams.get('session_id');

  if (!currentSlug) return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });

  try {
    let userBrainVector = null;

    if (sessionId) {
      const sessionData = await env.DB.prepare(`SELECT lexical_history FROM algo_user_sessions WHERE session_id = ?`).bind(sessionId).first();
      if (sessionData && sessionData.lexical_history) {
        try { 
            const parsed = JSON.parse(sessionData.lexical_history); 
            if (Array.isArray(parsed) && parsed.length === 768) userBrainVector = parsed;
        } catch(e) {}
      }
    }

    let aiMatches = [];

    if (userBrainVector) {
        try {
            const vectorRes = await env.VECTORIZE.query(userBrainVector, { topK: 20 });
            aiMatches = vectorRes.matches || []; 
        } catch (err) {
            console.error("Vectorize query failed, skipping AI tier:", err);
        }
    }

    const candidates = await fetchCandidates(env, 100, null);
    const engine = new RecommendationEngine(candidates);
    const recommendations = engine.getHybridRecommendations(aiMatches, 12, currentSlug);

    const finalFeed = recommendations.slice(0, 6);

    return new Response(JSON.stringify(finalFeed), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Recs API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}