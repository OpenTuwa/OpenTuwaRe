import { NeuralEngine } from '../_utils/algorithm.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { action, slug, session_id, duration } = data;

    if (!slug || !action) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    const sid = session_id || 'anonymous';
    if (sid === 'anonymous') return new Response(JSON.stringify({ success: true }), { status: 200 });

    const sessionProfile = await env.DB.prepare(`SELECT * FROM algo_user_sessions WHERE session_id = ?`).bind(sid).first();
    
    let userBrainVector = [];   
    let userVisualVector = [];  
    let baselineDwell = 5; // Expected baseline attention span in seconds
    
    if (sessionProfile) {
       try { userBrainVector = JSON.parse(sessionProfile.lexical_history || '[]'); } catch(e) {}
       try { userVisualVector = JSON.parse(sessionProfile.visual_history || '[]'); } catch(e) {}
       // Calculate user's historical average attention span
       if (sessionProfile.total_interactions > 0) {
           baselineDwell = sessionProfile.total_time_spent / sessionProfile.total_interactions;
       }
    }

    let textLearningRate = 0;
    let visualLearningRate = 0;
    const activeDuration = duration || 1;

    // DOPAMINE REWARD PREDICTION ERROR (RPE) CALCULATION
    // RPE = Actual Engagement - Expected Engagement
    const rpe = activeDuration - baselineDwell;
    
    // Sigmoid function to convert RPE into a learning multiplier (0.5 to 2.5x)
    const rpeMultiplier = 1 + (1.5 / (1 + Math.exp(-rpe / 10)));

    if (action === 'view') {
        textLearningRate = 0.05; 
        visualLearningRate = 0.10; 
    } else if (action === 'dwell_image') {
        // Apply RPE: If they stare longer than usual, rewire visual vectors heavily
        visualLearningRate = Math.min(0.75, 0.20 * rpeMultiplier); 
    } else if (action === 'read') {
        // Apply RPE: If they read longer than their baseline, wire the text vector
        textLearningRate = Math.min(0.70, 0.25 * rpeMultiplier); 
    } else if (action === 'share') {
        textLearningRate = 0.50; // Manual high-signal override
        visualLearningRate = 0.50;
    }

    // Update vectors using the dynamic learning rates
    if (textLearningRate > 0 || visualLearningRate > 0) {
        const article = await env.DB.prepare(`SELECT neural_vector, visual_vector FROM articles WHERE slug = ?`).bind(slug).first();
        if (article) {
            if (textLearningRate > 0 && article.neural_vector) {
                try {
                    const articleVector = JSON.parse(article.neural_vector);
                    userBrainVector = NeuralEngine.updateBrainVector(userBrainVector, articleVector, textLearningRate, 768);
                } catch (e) {}
            }
            if (visualLearningRate > 0 && article.visual_vector) {
                try {
                    const imgVector = JSON.parse(article.visual_vector);
                    userVisualVector = NeuralEngine.updateBrainVector(userVisualVector, imgVector, visualLearningRate, 512);
                } catch (e) {}
            }
        }
    }

    await env.DB.prepare(`
      INSERT INTO algo_user_sessions (
        session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent, lexical_history, visual_history
      ) VALUES (?, datetime('now'), datetime('now'), 1, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        total_interactions = total_interactions + 1,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        lexical_history = excluded.lexical_history,
        visual_history = excluded.visual_history
    `).bind(
      sid, 
      (action === 'ping' || action === 'dwell_image' || action === 'read' ? activeDuration : 0),
      JSON.stringify(userBrainVector), 
      JSON.stringify(userVisualVector)
    ).run();

    return new Response(JSON.stringify({ success: true, rpe_multiplier: rpeMultiplier }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}