import { getRequestContext } from '@cloudflare/next-on-pages';
import { NeuralEngine } from '../../../../functions/_utils/algorithm';

export const runtime = 'edge';

export async function POST(request) {
  const { env } = getRequestContext();

  try {
    const data = await request.json();
    const { action, slug, session_id, duration } = data;

    if (!slug || !action) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    const sid = session_id || 'anonymous';
    if (sid === 'anonymous') return new Response(JSON.stringify({ success: true }), { status: 200 });

    const sessionProfile = await env.DB.prepare(`SELECT * FROM algo_user_sessions WHERE session_id = ?`).bind(sid).first();
    
    let userBrainVector = [];   
    let userVisualVector = [];  
    let baselineDwell = 5; 
    
    if (sessionProfile) {
       try { userBrainVector = JSON.parse(sessionProfile.lexical_history || '[]'); } catch(e) {}
       try { userVisualVector = JSON.parse(sessionProfile.visual_history || '[]'); } catch(e) {}
       if (sessionProfile.total_interactions > 0) {
           baselineDwell = sessionProfile.total_time_spent / sessionProfile.total_interactions;
       }
    }

    let textLearningRate = 0;
    let visualLearningRate = 0;
    const activeDuration = duration || 1;

    const article = await env.DB.prepare(`SELECT neural_vector, visual_vector, avg_time_spent FROM articles WHERE slug = ?`).bind(slug).first();
    let articleBaseline = 10;
    if (article && article.avg_time_spent > 0) {
        articleBaseline = article.avg_time_spent;
    }

    const expectedDwell = (baselineDwell + articleBaseline) / 2;
    const rpe = activeDuration - expectedDwell;
    
    let rpeMultiplier = 1;
    if (rpe > 0) {
        rpeMultiplier = 1 + (2.0 / (1 + Math.exp(-rpe / 15)));
    } else {
        rpeMultiplier = Math.max(0.2, 1 + (rpe / Math.max(expectedDwell, 1)));
    }

    if (action === 'view') {
        textLearningRate = 0.05; 
        visualLearningRate = 0.10; 
    } else if (action === 'dwell_image') {
        visualLearningRate = Math.min(0.85, 0.20 * rpeMultiplier); 
    } else if (action === 'read') {
        textLearningRate = Math.min(0.80, 0.25 * rpeMultiplier); 
    } else if (action === 'share') {
        textLearningRate = 0.50;
        visualLearningRate = 0.50;
    }

    if ((textLearningRate > 0 || visualLearningRate > 0) && article) {
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

  } catch (err) {
    console.error('Interaction Tracking Error:', err);
    return new Response(JSON.stringify({ error: "Server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
