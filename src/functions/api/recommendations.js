import { RecommendationEngine, fetchCandidates } from '../utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const currentSlug = url.searchParams.get('slug');
  const sessionId = url.searchParams.get('session_id');

  if (!currentSlug) return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });

  try {
    let userBrainVector = null;

    // 1. Get the User's Neural "Ghost Profile"
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

    // 2. Query Cloudflare Vectorize
    // If we have a user brain vector, we query the neural DB to find articles that match their thoughts
    if (userBrainVector) {
        try {
            const vectorRes = await env.VECTORIZE.query(userBrainVector, { topK: 20 });
            aiMatches = vectorRes.matches || []; // Returns array: [{ id: 'slug-name', score: 0.89 }]
        } catch (err) {
            console.error("Vectorize query failed, skipping AI tier:", err);
        }
    }

    // 3. Fetch Candidates from D1 
    // Uses the central fetcher to grab everything needed for physics scoring
    const candidates = await fetchCandidates(env, 100, null);

    // 4. Activate the Hybrid Engine (Math + AI + Physics)
    const engine = new RecommendationEngine(candidates);
    const recommendations = engine.getHybridRecommendations(aiMatches, 12);

    // Filter out the article the user is currently reading
    const finalFeed = recommendations.filter(a => a.slug !== currentSlug).slice(0, 6);

    return new Response(JSON.stringify(finalFeed), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Recs API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}