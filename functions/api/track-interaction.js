import { SCORING_WEIGHTS } from '../utils/algorithm.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { 
      action, slug, session_id, duration,
      user_agent, platform, language, referrer,
      screen_width, screen_height, window_width, window_height,
      timezone, connection_type, device_memory, hardware_concurrency,
      scroll_depth,
      lexical_matrix // <--- EXTRACTING THE NEW DATA SENT FROM FRONTEND
    } = data;

    if (!slug || !action) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const sid = session_id || 'anonymous';
    if (sid === 'anonymous') {
       // We can't track anonymous users in this strict "User-Centric" architecture
       return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 1. Fetch the User's "Brain" (Session Row)
    const sessionProfile = await env.DB.prepare(`
      SELECT * FROM algo_user_sessions WHERE session_id = ?
    `).bind(sid).first();

    // 2. Prepare the History Objects (Lexical & Interaction)
    let lexicalMap = {};
    let interactionMap = {}; // New: Stores metrics per article for this specific user
    
    if (sessionProfile) {
       try { lexicalMap = JSON.parse(sessionProfile.lexical_history || '{}'); } catch(e) {}
       try { interactionMap = JSON.parse(sessionProfile.interaction_history || '{}'); } catch(e) {}
    }

    // 3. Update Interaction History for this specific article
    if (!interactionMap[slug]) {
       interactionMap[slug] = { views: 0, reads: 0, shares: 0, time_spent: 0, last_touched: Date.now() };
    }
    
    // Apply the action to the User's personal stats for this article
    if (action === 'view') interactionMap[slug].views++;
    if (action === 'read') interactionMap[slug].reads++;
    if (action === 'share') interactionMap[slug].shares++;
    if (action === 'ping') interactionMap[slug].time_spent += (duration || 5);
    interactionMap[slug].last_touched = Date.now();

    // 4. Update Lexical History (The "Taste" Profile)
    // NEW LOGIC: Use the frontend-generated matrix to skip the database query!
    if (action === 'view' && lexical_matrix) {
       try {
          // A. Update the User's Profile (Session)
          for (const [word, count] of Object.entries(lexical_matrix)) {
             lexicalMap[word] = (lexicalMap[word] || 0) + count;
          }
          // Cap lexical profile at 100 words to prevent explosion
          const sortedWords = Object.entries(lexicalMap).sort((a, b) => b[1] - a[1]).slice(0, 100);
          lexicalMap = {};
          sortedWords.forEach(([w, c]) => { lexicalMap[w] = c; });

          // B. DISTRIBUTED INDEXING: Update the Article's Matrix in the DB if missing
          // This ensures the "Content Match" algorithm has data to work with for everyone.
          if (Object.keys(lexical_matrix).length > 0) {
             env.DB.prepare(`
               UPDATE articles 
               SET lexical_matrix = ? 
               WHERE slug = ? AND (lexical_matrix IS NULL OR length(lexical_matrix) < 5)
             `).bind(JSON.stringify(lexical_matrix), slug).run().catch(() => {});
          }

       } catch(e) {
          // Ignore parsing/merging errors
       }
    }

    // 5. Save EVERYTHING to the Single Source of Truth (algo_user_sessions)
    // We smash all data into this one row per user.
    await env.DB.prepare(`
      INSERT INTO algo_user_sessions (
        session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent,
        user_agent, platform, language, referrer,
        screen_width, screen_height, window_width, window_height,
        timezone, connection_type, device_memory, hardware_concurrency,
        lexical_history, interaction_history
      )
      VALUES (?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        total_interactions = total_interactions + 1,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        window_width = excluded.window_width,
        window_height = excluded.window_height,
        lexical_history = excluded.lexical_history,
        interaction_history = excluded.interaction_history
    `).bind(
      sid, 
      1, // Initial interaction count
      (action === 'ping' ? (duration || 5) : 0),
      user_agent || null, platform || null, language || null, referrer || null,
      screen_width || null, screen_height || null, window_width || null, window_height || null,
      timezone || null, connection_type || null, device_memory || null, hardware_concurrency || null,
      JSON.stringify(lexicalMap),
      JSON.stringify(interactionMap)
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to track interaction", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}