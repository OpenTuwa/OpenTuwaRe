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

    // Prepare action metrics based on the incoming action type
    const metrics = {
      views: action === 'view' ? 1 : 0,
      reads: action === 'read' ? 1 : 0,
      shares: action === 'share' ? 1 : 0,
      time_spent: action === 'ping' ? (duration || 5) : 0 // Assume 5s heartbeat if ping
    };

    // 1. Log the individual interaction for training data history
    // We now capture comprehensive "Training Data" for future AI usage
    // This table acts as the raw memory of the system
    if (action !== 'ping') {
      // For main events (view, read, share), log EVERYTHING
      await env.DB.prepare(`
        INSERT INTO algo_interactions (
          session_id, article_slug, action_type, created_at,
          user_agent, platform, language, referrer,
          screen_width, screen_height, window_width, window_height,
          timezone, connection_type, device_memory, hardware_concurrency
        )
        VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        session_id || 'anonymous', slug, action,
        user_agent || null, platform || null, language || null, referrer || null,
        screen_width || null, screen_height || null, window_width || null, window_height || null,
        timezone || null, connection_type || null, device_memory || null, hardware_concurrency || null
      ).run();
    } else {
      // For pings, we might want to log scroll depth periodically or just update the metrics
      // To save space, we only log pings if they carry significant new data (like scroll depth update)
      // For now, we stick to updating the aggregate metrics to keep it fast
    }

    // 2. Upsert the aggregated metrics table for fast retrieval by the algorithm
    // We inject the SCORING_WEIGHTS directly into the SQL calculation
    // This ensures the database "engagement_score" always reflects the current Brain configuration
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
