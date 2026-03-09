import { RecommendationEngine } from '../utils/algorithm.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    
    // 1. Ask The Brain to retrieve candidate data
    // The Brain handles all SQL joins, metrics, and filtering internally.
    const rawResults = await RecommendationEngine.fetchCandidates(env, 100, q);

    // 2. Ask The Brain to process/rank the data
    const engine = new RecommendationEngine(rawResults);
    const finalResults = engine.getLatest(); 

    return Response.json(finalResults);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}