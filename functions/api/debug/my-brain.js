export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ===================================================================
    // THE X-RAY: GET /api/debug/my-brain?userId=YOUR_ID
    // ===================================================================
    if (url.pathname === '/api/debug/my-brain' && request.method === 'GET') {
      // Auth check
      const authHeader = request.headers.get('Authorization') || '';
      if (!env.ADMIN_SECRET || authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Grab the user ID from the URL, fallback to 'test_user'
      const userId = url.searchParams.get('userId') || 'test_user';
      const kvKey = `user_vector:${userId}`;

      try {
        // Fetch the raw brain vector from KV
        const userVector = await env.BRAIN_KV.get(kvKey, "json");

        if (!userVector) {
          return new Response(JSON.stringify({
            status: "empty",
            message: `No brain vector found for user: ${userId}. They need to read or share an article first to initialize their brain!`,
            dimensions: 0,
            vector_preview: []
          }, null, 2), { headers: { 'Content-Type': 'application/json' } });
        }

        // Calculate a few stats to prove the vector is actively learning
        const nonZeroCount = userVector.filter(v => v !== 0).length;
        const averageWeight = userVector.reduce((a, b) => a + b, 0) / userVector.length;

        return new Response(JSON.stringify({
          status: "active",
          user_id: userId,
          dimensions: userVector.length, // Should be 768
          active_nodes: nonZeroCount,
          average_weight: averageWeight.toFixed(6),
          // We slice the array so a 768-item list doesn't lag out your browser tab
          vector_preview_start: userVector.slice(0, 5),
          vector_preview_end: userVector.slice(-5)
        }, null, 2), { 
          headers: { 
            'Content-Type': 'application/json'
          } 
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ... [Your existing route handling goes here] ...
    
    return new Response("Not Found", { status: 404 });
  }
};