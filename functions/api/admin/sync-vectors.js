// /src/functions/api/admin/sync-vectors.js
import { NeuralEngine } from '../../_utils/algorithm.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  // 1. Simple security check
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== 'opentuwa-activate') {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 2. Find articles missing vectors – now up to 100 at a time
    const { results } = await env.DB.prepare(`
      SELECT slug, title, seo_description, content_html, image_url, neural_vector, visual_vector 
      FROM articles 
      WHERE neural_vector IS NULL OR visual_vector IS NULL 
      LIMIT 100
    `).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ 
        status: "🟢 ONLINE", 
        message: "All articles have been processed. The AI is fully active!" 
      }), { headers: { "Content-Type": "application/json" }});
    }

    const processed = [];
    const CONCURRENCY = 10; // Tune this: number of articles processed in parallel

    // Helper to process a single article (returns slug and generated vectors)
    const processArticle = async (article) => {
      let textVector = null;
      let visualVector = null;

      // Generate text vector (if missing) – runs in parallel with visual task below
      const textPromise = !article.neural_vector
        ? (async () => {
            const combinedText = `${article.title} ${article.seo_description || ''} ${article.content_html || ''}`
              .replace(/<[^>]*>?/gm, ' ')
              .substring(0, 3000);
            return NeuralEngine.getTextEmbedding(env, combinedText);
          })()
        : Promise.resolve(null);

      // Generate visual vector (if missing and image exists)
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

      // Wait for both tasks to complete
      [textVector, visualVector] = await Promise.all([textPromise, visualPromise]);

      return { slug: article.slug, textVector, visualVector };
    };

    // Process articles in chunks of CONCURRENCY
    for (let i = 0; i < results.length; i += CONCURRENCY) {
      const chunk = results.slice(i, i + CONCURRENCY);
      
      // Run the chunk in parallel
      const chunkResults = await Promise.all(chunk.map(article => processArticle(article)));

      // Update database and vectorize for each article in this chunk (also in parallel)
      await Promise.all(chunkResults.map(async ({ slug, textVector, visualVector }) => {
        if (!textVector && !visualVector) return;

        const updateQueries = [];
        const bindParams = [];

        if (textVector) {
          updateQueries.push("neural_vector = ?");
          bindParams.push(JSON.stringify(textVector));
          await env.VECTORIZE_TEXT.upsert([{ id: slug, values: textVector }]);
        }
        if (visualVector) {
          updateQueries.push("visual_vector = ?");
          bindParams.push(JSON.stringify(visualVector));
          await env.VECTORIZE_VISION.upsert([{ id: slug, values: visualVector }]);
        }

        bindParams.push(slug);

        await env.DB.prepare(`UPDATE articles SET ${updateQueries.join(', ')} WHERE slug = ?`)
          .bind(...bindParams)
          .run();

        processed.push(slug);
      }));
    }

    return new Response(JSON.stringify({ 
      status: "⚙️ PROCESSING", 
      message: `Successfully generated AI brain vectors for ${processed.length} articles.`, 
      processed_slugs: processed,
      action_required: processed.length < results.length 
        ? "Refresh this page to process the next batch." 
        : "All fetched articles have been processed."
    }), { headers: { "Content-Type": "application/json" }});

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
  }
}