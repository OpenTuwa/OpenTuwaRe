export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { action, slug, sessionId } = data;

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
      shares: action === 'share' ? 1 : 0
    };

    // 1. Log the individual interaction for training data history
    await env.DB.prepare(`
      INSERT INTO algo_interactions (session_id, article_slug, action_type, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(sessionId || 'anonymous', slug, action).run();

    // 2. Upsert the aggregated metrics table for fast retrieval by the algorithm
    await env.DB.prepare(`
      INSERT INTO algo_metrics (article_slug, total_views, total_reads, total_shares, engagement_score, last_updated)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(article_slug) DO UPDATE SET 
        total_views = total_views + excluded.total_views,
        total_reads = total_reads + excluded.total_reads,
        total_shares = total_shares + excluded.total_shares,
        engagement_score = ((total_views + excluded.total_views) * 1) + 
                           ((total_reads + excluded.total_reads) * 5) + 
                           ((total_shares + excluded.total_shares) * 10),
        last_updated = datetime('now')
    `).bind(slug, metrics.views, metrics.reads, metrics.shares, (metrics.views * 1 + metrics.reads * 5 + metrics.shares * 10)).run();

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
