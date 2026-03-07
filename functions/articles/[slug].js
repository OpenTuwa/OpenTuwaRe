export async function onRequestGet(context) {
  const { env, params, request } = context;
  // Detect common crawler user-agents; only return prerendered HTML for bots
  const ua = (request && request.headers && request.headers.get('user-agent')) || '';
  const botRegex = /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|googlebot|bingbot|duckduckbot|applebot)/i;
  if (!botRegex.test(ua)) {
    if (context && typeof context.next === 'function') {
      return await context.next();
    }
    // If we cannot delegate, let the browser handle (avoid returning prerender HTML)
    return new Response(null, { status: 204 });
  }
  try {
    const slug = params.slug;
    const { results } = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).all();
    if (!results || results.length === 0) return new Response('Not found', { status: 404 });
    const article = results[0];

    const title = article.title || 'Article';
    const description = article.seo_description || article.subtitle || (article.excerpt || '');
    const image = article.image_url || '';

    // Detect inline video or iframe sources in content_html (for social players)
    let videoSrc = '';
    let videoType = '';
    const htmlContent = (article.content_html || '').toString();
    try {
      // 1) <video src="..."> pattern
      const vMatch = htmlContent.match(/<video\b[^>]*\bsrc=["']([^"']+)["']/i);
      if (vMatch && vMatch[1]) {
        videoSrc = vMatch[1];
        // assume mp4 if extension present
        videoType = videoSrc.match(/\.mp4($|\?)/i) ? 'video/mp4' : '';
      }
      // 2) <source src="..."> inside <video>
      if (!videoSrc) {
        const sMatch = htmlContent.match(/<source\b[^>]*\bsrc=["']([^"']+)["']/i);
        if (sMatch && sMatch[1]) {
          videoSrc = sMatch[1];
          videoType = videoSrc.match(/\.mp4($|\?)/i) ? 'video/mp4' : '';
        }
      }
      // 3) iframe embeds (YouTube, Vimeo)
      if (!videoSrc) {
        const iMatch = htmlContent.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
        if (iMatch && iMatch[1]) {
          videoSrc = iMatch[1];
          // map known providers to player type
          if (/youtube\.com|youtu\.be/.test(videoSrc)) videoType = 'text/html';
          else if (/vimeo\.com/.test(videoSrc)) videoType = 'text/html';
        }
      }
      // Normalize YouTube iframe src to embed url if needed
      if (videoSrc && /youtube\.com\/watch\?v=/.test(videoSrc)) {
        const u = new URL(videoSrc, 'https://example.invalid');
        const v = u.searchParams.get('v');
        if (v) videoSrc = `https://www.youtube.com/embed/${v}`;
      }
      if (videoSrc && /youtu\.be\//.test(videoSrc)) {
        const m = videoSrc.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
        if (m && m[1]) videoSrc = `https://www.youtube.com/embed/${m[1]}`;
      }
    } catch (e) {
      // ignore parsing errors
      videoSrc = '';
      videoType = '';
    }
    const url = new URL(request.url).toString();

    // Build meta tags, adding video tags when a playable source is present
    let videoMeta = '';
    if (videoSrc) {
      const secure = videoSrc.startsWith('//') ? 'https:' + videoSrc : videoSrc;
      // Default dimensions
      const width = 1280;
      const height = 720;
      if (videoType === 'video/mp4') {
        videoMeta += `<meta property="og:video" content="${escapeHtml(secure)}">`;
        videoMeta += `<meta property="og:video:secure_url" content="${escapeHtml(secure)}">`;
        videoMeta += `<meta property="og:video:type" content="video/mp4">`;
        videoMeta += `<meta property="og:video:width" content="${width}">`;
        videoMeta += `<meta property="og:video:height" content="${height}">`;
        // Twitter player tags for MP4 (may not be supported everywhere)
        videoMeta += `<meta name="twitter:player" content="${escapeHtml(secure)}">`;
        videoMeta += `<meta name="twitter:player:width" content="${width}">`;
        videoMeta += `<meta name="twitter:player:height" content="${height}">`;
        // Also expose a same-origin embeddable player HTML so Facebook/X/WhatsApp can load a player
        try {
          const origin = new URL(request.url).origin;
          const playerUrl = `${origin}/player/${encodeURIComponent(slug)}`;
          videoMeta += `<meta property="og:video" content="${escapeHtml(playerUrl)}">`;
          videoMeta += `<meta property="og:video:secure_url" content="${escapeHtml(playerUrl)}">`;
          videoMeta += `<meta property="og:video:type" content="text/html">`;
          videoMeta += `<meta name="twitter:card" content="player">`;
          videoMeta += `<meta name="twitter:player" content="${escapeHtml(playerUrl)}">`;
          videoMeta += `<meta name="twitter:player:width" content="${width}">`;
          videoMeta += `<meta name="twitter:player:height" content="${height}">`;
        } catch (e) {}
      } else if (videoType === 'text/html') {
        // iframe player (YouTube/Vimeo)
        const playerUrl = videoSrc;
        videoMeta += `<meta property="og:video" content="${escapeHtml(playerUrl)}">`;
        videoMeta += `<meta property="og:video:secure_url" content="${escapeHtml(playerUrl)}">`;
        videoMeta += `<meta property="og:video:type" content="text/html">`;
        videoMeta += `<meta property="og:video:width" content="${width}">`;
        videoMeta += `<meta property="og:video:height" content="${height}">`;
        // Twitter player (iframe)
        videoMeta += `<meta name="twitter:player" content="${escapeHtml(playerUrl)}">`;
        videoMeta += `<meta name="twitter:player:width" content="${width}">`;
        videoMeta += `<meta name="twitter:player:height" content="${height}">`;
      } else {
        // Unknown type — still expose as og:video with type left out
        videoMeta += `<meta property="og:video" content="${escapeHtml(secure)}">`;
      }
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${escapeHtml(title)} | OpenTuwa</title>
      <meta name="description" content="${escapeHtml(description)}">
      <meta property="og:type" content="article">
      <meta property="og:title" content="${escapeHtml(title)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
      ${videoMeta}
      <meta property="og:url" content="${escapeHtml(url)}">
      <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
      <meta name="twitter:title" content="${escapeHtml(title)}">
      <meta name="twitter:description" content="${escapeHtml(description)}">
      ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
      <link rel="canonical" href="${escapeHtml(url)}">
    </head><body>
      <main style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:4rem auto;padding:1rem;">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="${escapeHtml(url)}">Read on OpenTuwa</a></p>
      </main>
    </body></html>`;

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
