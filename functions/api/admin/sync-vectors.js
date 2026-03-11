// /src/functions/api/admin/sync-vectors.js
import { NeuralEngine } from '../../_utils/algorithm.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  // 1. Simple security check (so random people can't trigger your AI)
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== 'opentuwa-activate') {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 2. Find articles that don't have AI vectors yet (Limit to 3 at a time to prevent timeout)
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

    let processed = [];

    // 3. Feed the articles to the Neural Engine
    for (const article of results) {
      let textVector = null;
      let visualVector = null;

      // Generate TEXT Vector (The Logical Brain)
      if (!article.neural_vector) {
        const combinedText = `${article.title} ${article.seo_description || ''} ${article.content_html || ''}`
            .replace(/<[^>]*>?/gm, ' ') // strip HTML tags
            .substring(0, 3000);
            
        textVector = await NeuralEngine.getTextEmbedding(env, combinedText);
      }

      // Generate VISUAL Vector (The Amygdala/Image Brain)
      if (!article.visual_vector && article.image_url) {
        try {
          // Fix relative URLs
          let imgUrl = article.image_url;
          if (imgUrl.startsWith('/')) {
            imgUrl = new URL(imgUrl, request.url).toString();
          }
          
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            visualVector = await NeuralEngine.getVisualEmbedding(env, arrayBuffer);
          }
        } catch (e) {
          console.error("Failed to fetch image for AI processing:", e.message);
        }
      }

      // 4. Save the generated Vectors to the Database AND Vectorize
      if (textVector || visualVector) {
        const updateQueries = [];
        const bindParams = [];
        
        if (textVector) {
          updateQueries.push("neural_vector = ?");
          bindParams.push(JSON.stringify(textVector));
          // Insert into Vectorize TEXT index
          await env.VECTORIZE_TEXT.upsert([{ id: article.slug, values: textVector }]);
        }
        
        if (visualVector) {
          updateQueries.push("visual_vector = ?");
          bindParams.push(JSON.stringify(visualVector));
          // Insert into Vectorize VISION index
          await env.VECTORIZE_VISION.upsert([{ id: article.slug, values: visualVector }]);
        }

        bindParams.push(article.slug);

        // Update D1 Database
        await env.DB.prepare(`UPDATE articles SET ${updateQueries.join(', ')} WHERE slug = ?`)
          .bind(...bindParams)
          .run();

        processed.push(article.slug);
      }
    }

    return new Response(JSON.stringify({ 
      status: "⚙️ PROCESSING", 
      message: `Successfully generated AI brain vectors for ${processed.length} articles.`, 
      processed_slugs: processed,
      action_required: "Refresh this page to process the next batch of 3 articles."
    }), { headers: { "Content-Type": "application/json" }});

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
  }
}