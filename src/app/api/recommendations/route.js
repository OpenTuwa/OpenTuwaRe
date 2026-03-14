import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request) {
  const { env } = getRequestContext();
  
  // Import the algorithm utilities
  const { fetchCandidates, RecommendationEngine } = await import('../../../utils/algorithm.js');
  
  const url = new URL(request.url);
  const currentSlug = url.searchParams.get('slug');
  const sessionId = url.searchParams.get('session_id');
  const videoOnly = url.searchParams.get('video_only') === 'true';

  if (!currentSlug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    let userVector = null;

    // Try to get user vector from KV (Hebbian memory)
    if (sessionId) {
      const kvKey = `user_vector:${sessionId}`;
      try {
        userVector = await env.BRAIN_KV.get(kvKey, "json");
      } catch(e) {
        console.error("KV fetch failed:", e);
      }
    }

    // Fallback to the current article's neural_vector if no user vector exists
    if (!userVector && currentSlug) {
      const articleData = await env.DB.prepare(`SELECT neural_vector FROM articles WHERE slug = ?`).bind(currentSlug).first();
      if (articleData && articleData.neural_vector) {
        try {
          const parsed = typeof articleData.neural_vector === 'string' ? JSON.parse(articleData.neural_vector) : articleData.neural_vector;
          if (Array.isArray(parsed) && parsed.length === 768) userVector = parsed;
        } catch(e) {}
      }
    }

    // Fetch candidates from D1 (includes pre-computed neural_vector and visual_vector as JSON)
    const candidates = await fetchCandidates(env, 100, null);
    
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify([]), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const engine = new RecommendationEngine(candidates);

    // Use new API: pass userVector directly, engine does in-memory cosine similarity
    let recommendations = [];
    try {
      recommendations = videoOnly 
        ? engine.getHybridVideoRecommendations(userVector, 24, currentSlug, 0)
        : engine.getHybridRecommendations(userVector, 24, currentSlug, 0);
    } catch (engineError) {
      console.error("Recommendation Engine Logic Error:", engineError);
      recommendations = candidates.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, 24);
    }

    // Strip heavy vector arrays to save bandwidth
    const finalFeed = recommendations.slice(0, 24).map(article => {
      // eslint-disable-next-line no-unused-vars
      const { neural_vector, visual_vector, ...cleanArticle } = article;
      return cleanArticle;
    });

    return new Response(JSON.stringify(finalFeed), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Recs API Critical Error:", err);
    return new Response(JSON.stringify([]), { 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
