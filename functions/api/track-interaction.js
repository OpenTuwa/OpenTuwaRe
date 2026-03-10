import { NeuralEngine, SCORING_WEIGHTS } from '../_utils/algorithm.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { action, slug, session_id, duration } = data;

    if (!slug || !action) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const sid = session_id || 'anonymous';
    if (sid === 'anonymous') return new Response(JSON.stringify({ success: true }), { status: 200 });

    const sessionProfile = await env.DB.prepare(`SELECT * FROM algo_user_sessions WHERE session_id = ?`).bind(sid).first();
    
    let interactionMap = {};
    let userBrainVector = [];   // 768d text vector
    let userVisualVector = [];  // 512d image vector
    
    if (sessionProfile) {
       try { interactionMap = JSON.parse(sessionProfile.interaction_history || '{}'); } catch(e) {}
       try { userBrainVector = JSON.parse(sessionProfile.lexical_history || '[]'); } catch(e) {}
       try { userVisualVector = JSON.parse(sessionProfile.visual_history || '[]'); } catch(e) {}
    }

    if (!interactionMap[slug]) interactionMap[slug] = { views: 0, reads: 0, shares: 0, image_dwell: 0, time_spent: 0 };
    
    let textLearningRate = 0;
    let visualLearningRate = 0;

    // ENHANCED: Dynamic Exploitative Routing Logic (Reward Prediction Error)
    const activeDuration = duration || 1;

    if (action === 'view') {
        interactionMap[slug].views++;
        textLearningRate = 0.05; 
        visualLearningRate = 0.15; // Baseline visual imprint
    } else if (action === 'dwell_image') {
        interactionMap[slug].image_dwell += activeDuration;
        // Dynamic intensity scaling: Longer dwell = exponential visual weight shift
        visualLearningRate = Math.min(0.60, 0.15 + (Math.log10(activeDuration + 1) * 0.2)); 
    } else if (action === 'read') {
        interactionMap[slug].reads++;
        // Dynamic intensity scaling based on reading depth
        textLearningRate = Math.min(0.50, 0.10 + (Math.log10(activeDuration + 1) * 0.15)); 
    } else if (action === 'share') {
        interactionMap[slug].shares++;
        textLearningRate = 0.40; // High dopamine event
        visualLearningRate = 0.40;
    } else if (action === 'ping') {
        interactionMap[slug].time_spent += activeDuration;
        textLearningRate = 0.02; 
    }

    if (textLearningRate > 0 || visualLearningRate > 0) {
        const article = await env.DB.prepare(`
          SELECT neural_vector, visual_vector FROM articles WHERE slug = ?
        `).bind(slug).first();
        
        if (article) {
            if (textLearningRate > 0 && article.neural_vector) {
                try {
                    const articleVector = JSON.parse(article.neural_vector);
                    if (articleVector.length === 768) {
                        userBrainVector = NeuralEngine.updateBrainVector(userBrainVector, articleVector, textLearningRate, 768);
                    }
                } catch (e) { console.error("Lexical parse failed", e); }
            }
            if (visualLearningRate > 0 && article.visual_vector) {
                try {
                    const imgVector = JSON.parse(article.visual_vector);
                    if (imgVector.length === 512) {
                        userVisualVector = NeuralEngine.updateBrainVector(userVisualVector, imgVector, visualLearningRate, 512);
                    }
                } catch (e) { console.error("Visual parse failed", e); }
            }
        }
    }

    await env.DB.prepare(`
      INSERT INTO algo_user_sessions (
        session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent, lexical_history, visual_history, interaction_history
      ) VALUES (?, datetime('now'), datetime('now'), 1, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        total_interactions = total_interactions + 1,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        lexical_history = excluded.lexical_history,
        visual_history = excluded.visual_history,
        interaction_history = excluded.interaction_history
    `).bind(
      sid, 
      (action === 'ping' ? activeDuration : 0),
      JSON.stringify(userBrainVector), 
      JSON.stringify(userVisualVector),
      JSON.stringify(interactionMap)
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to track interaction", details: error.message }), { status: 500 });
  }
}