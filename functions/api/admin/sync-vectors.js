// /src/functions/api/admin/[[path]].js
// Combined admin worker: SQL executor + vector sync

const CHUNK_SIZE = 4000; // characters per chunk for large UPDATEs
const SECRET = 'opentuwa-activate'; // change to your own secret

// ---------- Helper: split large UPDATE into chunks ----------
function splitLargeUpdate(sql) {
  // Detect: UPDATE table SET col = '...huge...' WHERE ...
  const pattern = /^(UPDATE\s+.+?\s+SET\s+(\S+)\s*=\s*)'(.*?)'(\s+WHERE\s+.+)$/is;
  const match = sql.match(pattern);
  if (!match) return [sql]; // not a simple UPDATE

  const prefix = match[1];   // UPDATE table SET col = 
  const colName = match[2];  // col
  const value = match[3];    // huge string
  const where = match[4];    // WHERE ...

  if (value.length <= CHUNK_SIZE) return [sql];

  // Split into chunks
  const chunks = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  const statements = [];
  // First chunk: SET col = 'chunk1'
  statements.push(`${prefix}'${chunks[0].replace(/'/g, "''")}'${where}`);

  // Subsequent chunks: SET col = col || 'chunkN'
  const tableName = sql.match(/UPDATE\s+(\S+)/i)[1];
  for (let i = 1; i < chunks.length; i++) {
    const escaped = chunks[i].replace(/'/g, "''");
    statements.push(
      `UPDATE ${tableName} SET ${colName} = ${colName} || '${escaped}' ${where}`
    );
  }
  return statements;
}

// ---------- SQL executor (chunked) ----------
async function executeSql(env, sql) {
  const statements = splitLargeUpdate(sql);
  const results = [];

  for (const stmt of statements) {
    try {
      const res = await env.DB.prepare(stmt).run();
      results.push({ success: true, stmt, meta: res });
    } catch (err) {
      results.push({ success: false, stmt, error: err.message });
      break; // stop on first error
    }
  }
  return results;
}

// ---------- Vector sync (from sync-vectors.js) ----------
async function syncVectors(env, request) {
  // Find articles missing vectors
  const { results } = await env.DB.prepare(`
    SELECT slug, title, seo_description, content_html, image_url, neural_vector, visual_vector 
    FROM articles 
    WHERE neural_vector IS NULL OR visual_vector IS NULL 
    LIMIT 100
  `).all();

  if (!results || results.length === 0) {
    return { status: "🟢 ONLINE", message: "All articles have been processed. The AI is fully active!" };
  }

  const CONCURRENCY = 10;
  const processed = [];

  // Helper to process one article
  const processArticle = async (article) => {
    let textVector = null;
    let visualVector = null;

    const textPromise = !article.neural_vector
      ? (async () => {
          const combinedText = `${article.title} ${article.seo_description || ''} ${article.content_html || ''}`
            .replace(/<[^>]*>?/gm, ' ')
            .substring(0, 3000);
          // NeuralEngine.getTextEmbedding should be available; adjust import as needed
          return NeuralEngine.getTextEmbedding(env, combinedText);
        })()
      : Promise.resolve(null);

    const visualPromise = (!article.visual_vector && article.image_url)
      ? (async () => {
          try {
            let imgUrl = article.image_url;
            if (imgUrl.startsWith('/')) {
              imgUrl = new URL(imgUrl, request.url).toString();
            }
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) return null;
            const arrayBuffer = await imgRes.arrayBuffer();
            return NeuralEngine.getVisualEmbedding(env, arrayBuffer);
          } catch (e) {
            console.error(`Failed to fetch image for ${article.slug}:`, e.message);
            return null;
          }
        })()
      : Promise.resolve(null);

    [textVector, visualVector] = await Promise.all([textPromise, visualPromise]);
    return { slug: article.slug, textVector, visualVector };
  };

  // Process in chunks
  for (let i = 0; i < results.length; i += CONCURRENCY) {
    const chunk = results.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(article => processArticle(article)));

    await Promise.all(chunkResults.map(async ({ slug, textVector, visualVector }) => {
      if (!textVector && !visualVector) return;

      const updates = [];
      const params = [];

      if (textVector) {
        updates.push("neural_vector = ?");
        params.push(JSON.stringify(textVector));
        await env.VECTORIZE_TEXT.upsert([{ id: slug, values: textVector }]);
      }
      if (visualVector) {
        updates.push("visual_vector = ?");
        params.push(JSON.stringify(visualVector));
        await env.VECTORIZE_VISION.upsert([{ id: slug, values: visualVector }]);
      }

      params.push(slug);
      await env.DB.prepare(`UPDATE articles SET ${updates.join(', ')} WHERE slug = ?`)
        .bind(...params)
        .run();

      processed.push(slug);
    }));
  }

  return {
    status: "⚙️ PROCESSING",
    message: `Successfully generated AI brain vectors for ${processed.length} articles.`,
    processed_slugs: processed,
    action_required: processed.length < results.length
      ? "Refresh this page to process the next batch."
      : "All fetched articles have been processed."
  };
}

// ---------- Router ----------
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Simple secret check on all admin endpoints
  if (url.searchParams.get('secret') !== SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Route: /admin/sql (POST)
  if (url.pathname.endsWith('/sql') && request.method === 'POST') {
    try {
      const { sql } = await request.json();
      if (!sql || typeof sql !== 'string') {
        return new Response(JSON.stringify({ error: "Missing 'sql' field" }), { status: 400 });
      }

      const results = await executeSql(env, sql);
      const allOk = results.every(r => r.success);
      return new Response(JSON.stringify({
        success: allOk,
        chunk_count: results.length,
        details: results
      }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // Route: /admin/sync-vectors (GET) – existing endpoint
  if (url.pathname.endsWith('/sync-vectors') && request.method === 'GET') {
    try {
      const result = await syncVectors(env, request);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
    }
  }

  // Fallback
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
}