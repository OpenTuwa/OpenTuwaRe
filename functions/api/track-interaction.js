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
    let userBrainVector = [];
    
    if (sessionProfile) {
       try { interactionMap = JSON.parse(sessionProfile.interaction_history || '{}'); } catch(e) {}
       try { userBrainVector = JSON.parse(sessionProfile.lexical_history || '[]'); } catch(e) {}
    }

    if (!interactionMap[slug]) interactionMap[slug] = { views: 0, reads: 0, shares: 0, time_spent: 0 };
    
    // Determine the neuroplasticity weight based on the action
    let learningRate = 0;

    if (action === 'view') {
        interactionMap[slug].views++;
        learningRate = 0.05; // Low impact memory
    } else if (action === 'read') {
        interactionMap[slug].reads++;
        learningRate = 0.15; // Medium impact memory
    } else if (action === 'share') {
        interactionMap[slug].shares++;
        learningRate = 0.30; // High impact memory
    } else if (action === 'ping') {
        interactionMap[slug].time_spent += (duration || 5);
        // Time spent reinforces existing pathways incrementally
        learningRate = 0.01; 
    }

    // Only update the neural vector if there is a significant learning event
    if (learningRate > 0) {
        // Fetch the pre-computed article vector (Do not re-embed on the fly!)
        const article = await env.DB.prepare(`
          SELECT neural_vector FROM articles WHERE slug = ?
        `).bind(slug).first();
        
        if (article && article.neural_vector) {
            try {
                const articleVector = JSON.parse(article.neural_vector);
                if (articleVector.length === 768) {
                    userBrainVector = NeuralEngine.updateBrainVector(userBrainVector, articleVector, learningRate);
                }
            } catch (e) {
                console.error("Failed to parse article neural vector", e);
            }
        }
    }

    await env.DB.prepare(`
      INSERT INTO algo_user_sessions (
        session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent, lexical_history, interaction_history
      ) VALUES (?, datetime('now'), datetime('now'), 1, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        total_interactions = total_interactions + 1,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        lexical_history = excluded.lexical_history,
        interaction_history = excluded.interaction_history
    `).bind(
      sid, 
      (action === 'ping' ? (duration || 5) : 0),
      JSON.stringify(userBrainVector), 
      JSON.stringify(interactionMap)
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Tracking Error:", error);
    return new Response(JSON.stringify({ error: "Failed to track interaction", details: error.message }), { status: 500 });
  }
}