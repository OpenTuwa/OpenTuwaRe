import { RecommendationEngine, fetchCandidates } from '../_utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const currentSlug = url.searchParams.get('slug');
  const sessionId = url.searchParams.get('session_id');
  const videoOnly = url.searchParams.get('video_only') === 'true'; // <-- NEW

  if (!currentSlug) return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });

  try {
    let userBrainVector = null;
    let userVisualVector = null;

    if (sessionId) {
      const sessionData = await env.DB.prepare(`SELECT lexical_history, visual_history FROM algo_user_sessions WHERE session_id = ?`).bind(sessionId).first();
      if (sessionData) {
        if (sessionData.lexical_history) {
            try { 
                const parsed = JSON.parse(sessionData.lexical_history); 
                if (Array.isArray(parsed) && parsed.length === 768) userBrainVector = parsed;
            } catch(e) {}
        }
        if (sessionData.visual_history) {
            try {
                const parsed = JSON.parse(sessionData.visual_history);
                if (Array.isArray(parsed) && parsed.length === 512) userVisualVector = parsed;
            } catch(e) {}
        }
      }
    }

    // Fallback to the current article's vectors if the user session has no AI data yet
    if (currentSlug && (!userBrainVector || !userVisualVector)) {
        const articleData = await env.DB.prepare(`SELECT neural_vector, visual_vector FROM articles WHERE slug = ?`).bind(currentSlug).first();
        if (articleData) {
            if (!userBrainVector && articleData.neural_vector) {
                try {
                    const parsed = typeof articleData.neural_vector === 'string' ? JSON.parse(articleData.neural_vector) : articleData.neural_vector;
                    if (Array.isArray(parsed) && parsed.length === 768) userBrainVector = parsed;
                } catch(e) {}
            }
            if (!userVisualVector && articleData.visual_vector) {
                try {
                    const parsed = typeof articleData.visual_vector === 'string' ? JSON.parse(articleData.visual_vector) : articleData.visual_vector;
                    if (Array.isArray(parsed) && parsed.length === 512) userVisualVector = parsed;
                } catch(e) {}
            }
        }
    }

    let aiTextMatches = [];
    let aiVisualMatches = [];

    // Execute neural searches concurrently to prevent latency drop-off
    const vectorTasks = [];
    
    if (userBrainVector) {
        vectorTasks.push(env.VECTORIZE_TEXT.query(userBrainVector, { topK: 20 })
            .then(res => aiTextMatches = res.matches || [])
            .catch(err => console.error("Text vectorize failed:", err)));
    }
    
    if (userVisualVector) {
        vectorTasks.push(env.VECTORIZE_VISION.query(userVisualVector, { topK: 20 })
            .then(res => aiVisualMatches = res.matches || [])
            .catch(err => console.error("Visual vectorize failed:", err)));
    }

    await Promise.all(vectorTasks);

    const candidates = await fetchCandidates(env, 100, null);
    const engine = new RecommendationEngine(candidates);

    // <-- UPDATED: Route to the new algorithm set if requested
    const recommendations = videoOnly 
        ? engine.getHybridVideoRecommendations(aiTextMatches, aiVisualMatches, 12, currentSlug)
        : engine.getHybridRecommendations(aiTextMatches, aiVisualMatches, 12, currentSlug);

    const finalFeed = recommendations.slice(0, 6);

    return new Response(JSON.stringify(finalFeed), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Recs API Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}