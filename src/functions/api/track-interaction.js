import { NeuralEngine } from '../utils/algorithm.js';

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

    // 1. Get the User's Profile
    const sessionProfile = await env.DB.prepare(`SELECT * FROM algo_user_sessions WHERE session_id = ?`).bind(sid).first();
    
    let interactionMap = {};
    let userBrainVector = [];
    let totalInteractions = 0;
    
    if (sessionProfile) {
       try { interactionMap = JSON.parse(sessionProfile.interaction_history || '{}'); } catch(e) {}
       try { userBrainVector = JSON.parse(sessionProfile.lexical_history || '[]'); } catch(e) {}
       totalInteractions = sessionProfile.total_interactions || 0;
    }

    if (!interactionMap[slug]) interactionMap[slug] = { views: 0, reads: 0, shares: 0, time_spent: 0 };
    if (action === 'view') interactionMap[slug].views++;
    if (action === 'read') interactionMap[slug].reads++;
    if (action === 'share') interactionMap[slug].shares++;
    if (action === 'ping') interactionMap[slug].time_spent += (duration || 5);

    // 2. NEURAL AI UPDATE (Only triggered on the first 'view' to save AI compute)
    if (action === 'view') {
        const article = await env.DB.prepare(`SELECT title, subtitle, seo_description FROM articles WHERE slug = ?`).bind(slug).first();
        if (article) {
            const articleText = `${article.title} ${article.subtitle} ${article.seo_description}`;
            
            // Call Cloudflare GPU for Neural Semantic Vector
            const articleVector = await NeuralEngine.getEmbedding(env, articleText);
            
            if (articleVector && articleVector.length === 768) {
                // Upsert Article to Cloudflare Vectorize (so it can be recommended to others)
                await env.VECTORIZE.upsert([{ id: slug, values: articleVector }]);

                // Shift User's Ghost Profile toward this new concept
                userBrainVector = NeuralEngine.updateAverageVector(userBrainVector, articleVector, totalInteractions);
            }
        }
    }

    // 3. Save Everything to D1 Database
    // We are reusing the 'lexical_history' column to store the 768-Float Vector to avoid needing a DB Migration
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