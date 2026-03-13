import { RecommendationEngine, fetchCandidates } from '../_utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    
    // 1. Fetch candidate data using the new standalone function
    const rawResults = await fetchCandidates(env, 100, q);

    // 2. Ask the Hybrid Engine to process/rank the data
    const engine = new RecommendationEngine(rawResults);
    
    // 3. Use getTrending to show the "Smart Feed" (Physics + Content IQ)
    const finalResults = engine.getTrending(100); 

    return new Response(JSON.stringify(finalResults), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (err) {
    console.error("API Article Error:", err);
    // Safe fallback so the frontend never crashes with '.reduce is not a function'
    return new Response(JSON.stringify([]), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}