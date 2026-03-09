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
      scroll_depth
    } = data;

    if (!slug || !action) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const sid = session_id || 'anonymous';

    // Prepare action metrics based on the incoming action type
    const metrics = {
      views: action === 'view' ? 1 : 0,
      reads: action === 'read' ? 1 : 0,
      shares: action === 'share' ? 1 : 0,
      time_spent: action === 'ping' ? (duration || 5) : 0 // Assume 5s heartbeat if ping
    };

    // ==============================================================================
    // 1. UPDATE WORLDWIDE ARTICLE METRICS (The Global Vote)
    // ==============================================================================
    await env.DB.prepare(`
      INSERT INTO algo_metrics (article_slug, total_views, total_reads, total_shares, engagement_score, total_time_spent, avg_time_spent, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(article_slug) DO UPDATE SET 
        total_views = total_views + excluded.total_views,
        total_reads = total_reads + excluded.total_reads,
        total_shares = total_shares + excluded.total_shares,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        avg_time_spent = (total_time_spent + excluded.total_time_spent) / CASE WHEN (total_views + excluded.total_views) > 0 THEN (total_views + excluded.total_views) ELSE 1 END,
        engagement_score = ((total_views + excluded.total_views) * ${SCORING_WEIGHTS.VIEW}) + 
                           ((total_reads + excluded.total_reads) * ${SCORING_WEIGHTS.READ}) + 
                           ((total_shares + excluded.total_shares) * ${SCORING_WEIGHTS.SHARE}) +
                           (avg_time_spent * ${SCORING_WEIGHTS.TIME_SPENT_FACTOR}),
        last_updated = datetime('now')
    `).bind(slug, metrics.views, metrics.reads, metrics.shares, 
            (metrics.views * SCORING_WEIGHTS.VIEW + metrics.reads * SCORING_WEIGHTS.READ + metrics.shares * SCORING_WEIGHTS.SHARE), 
            metrics.time_spent, metrics.time_spent).run();

    // ==============================================================================
    // 2. BUILD THE USER GHOST PROFILE (Session-Level Aggregation)
    // Avoids database bloat. 1 Session = 1 Row. We continually update this row.
    // ==============================================================================
    if (sid !== 'anonymous') {
      // If it's a new view, fetch the article's lexical matrix to merge into the user's brain
      let currentLexical = null;
      if (action === 'view') {
         const articleData = await env.DB.prepare('SELECT lexical_matrix FROM articles WHERE slug = ?').bind(slug).first();
         if (articleData && articleData.lexical_matrix) {
             currentLexical = articleData.lexical_matrix;
         }
      }

      // Fetch existing session profile
      const sessionProfile = await env.DB.prepare('SELECT lexical_history, total_interactions, total_time_spent FROM algo_user_sessions WHERE session_id = ?').bind(sid).first();
      
      let mergedLexical = "{}";
      if (sessionProfile && sessionProfile.lexical_history) {
         mergedLexical = sessionProfile.lexical_history;
      }

      // Merge matrices in JS if we have new data
      if (currentLexical) {
         try {
           const existing = JSON.parse(mergedLexical);
           const incoming = JSON.parse(currentLexical);
           for (const [word, count] of Object.entries(incoming)) {
              existing[word] = (existing[word] || 0) + count;
           }
           // Keep profile from growing infinitely large: cap at top 100 words
           const sortedWords = Object.entries(existing)
             .sort((a, b) => b[1] - a[1])
             .slice(0, 100);
           const finalMatrix = {};
           sortedWords.forEach(([w, c]) => { finalMatrix[w] = c; });
           mergedLexical = JSON.stringify(finalMatrix);
         } catch(e) {}
      }

      // UPSERT the Session Row
      await env.DB.prepare(`
        INSERT INTO algo_user_sessions (
          session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent,
          user_agent, platform, language, referrer,
          screen_width, screen_height, window_width, window_height,
          timezone, connection_type, device_memory, hardware_concurrency,
          lexical_history
        )
        VALUES (?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          last_seen_at = datetime('now'),
          total_interactions = total_interactions + excluded.total_interactions,
          total_time_spent = total_time_spent + excluded.total_time_spent,
          window_width = excluded.window_width,  -- update dynamic client data
          window_height = excluded.window_height,
          lexical_history = excluded.lexical_history
      `).bind(
        sid, 
        (metrics.views + metrics.reads + metrics.shares > 0 ? 1 : 0), // Add 1 interaction
        metrics.time_spent,
        user_agent || null, platform || null, language || null, referrer || null,
        screen_width || null, screen_height || null, window_width || null, window_height || null,
        timezone || null, connection_type || null, device_memory || null, hardware_concurrency || null,
        mergedLexical
      ).run();
    }

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
