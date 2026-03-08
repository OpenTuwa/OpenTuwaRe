export async function onRequestGet(context) {
  const { env } = context;
  try {
    // Select all authors from your D1 table, ordered by ID (so the publisher/owner is likely first)
    const { results } = await env.DB.prepare(
      "SELECT * FROM authors ORDER BY id ASC"
    ).all();

    return Response.json(results || []);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch authors", details: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}