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
    const imageAlt = article.image_alt || article.image_description || title;
    const authorName = article.author_name || article.author || 'OpenTuwa';
    const publishedAt = article.published_at || article.created_at || article.date_published || '';
    const updatedAt = article.updated_at || article.modified_at || article.date_updated || publishedAt;
    // build images array (support a JSON field or single image_url)
    let images = [];
    try {
      if (article.images_json) {
        const parsed = typeof article.images_json === 'string' ? JSON.parse(article.images_json) : article.images_json;
        if (Array.isArray(parsed)) images = parsed.filter(Boolean);
      }
    } catch (e) { images = []; }
    if (!images.length && image) images = [image];
    // also extract <img src> occurrences from the article HTML to ensure all in-content images are exposed
    try {
      const imgMatches = Array.from(htmlContent.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/ig));
      for (const m of imgMatches) {
        if (m && m[1]) {
          const src = m[1];
          if (!images.includes(src)) images.push(src);
        }
      }
    } catch (e) {}
    // keywords/tags
    let keywords = '';
    try {
      if (article.tags) {
        if (Array.isArray(article.tags)) keywords = article.tags.join(', ');
        else if (typeof article.tags === 'string') keywords = article.tags;
      }
    } catch (e) { keywords = ''; }

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
      <meta name="robots" content="index, follow, max-image-preview:large">
      ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
      ${images && images.length ? `<meta property="og:image" content="${escapeHtml(images[0])}">` : ''}
      ${images && images.length && imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">` : ''}
      <meta property="og:type" content="article">
      <meta property="og:title" content="${escapeHtml(title)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      ${images && images.length ? images.map(img=>`<meta property="og:image" content="${escapeHtml(img)}">`).join('') : ''}
      ${videoMeta}
      <meta property="og:url" content="${escapeHtml(url)}">
      ${publishedAt ? `<meta property="article:published_time" content="${escapeHtml(isoDate(publishedAt) || '')}">` : ''}
      ${updatedAt ? `<meta property="article:modified_time" content="${escapeHtml(isoDate(updatedAt) || '')}">` : ''}
      ${article.section || article.category ? `<meta property="article:section" content="${escapeHtml(article.section || article.category || '')}">` : ''}
      ${keywords ? (Array.isArray(article.tags) ? article.tags.map(t=>`<meta property="article:tag" content="${escapeHtml(t)}">`).join('') : (keywords ? `<meta property="article:tag" content="${escapeHtml(keywords)}">` : '')) : ''}
      <meta name="twitter:card" content="${images && images.length ? 'summary_large_image' : 'summary'}">
      <meta name="twitter:title" content="${escapeHtml(title)}">
      <meta name="twitter:description" content="${escapeHtml(description)}">
      ${images && images.length ? `<meta name="twitter:image" content="${escapeHtml(images[0])}">` : ''}
      ${images && images.length && imageAlt ? `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">` : ''}
      <link rel="canonical" href="${escapeHtml(url)}">
      <!-- Structured data for Article / VideoObject to help search engines and AI understand content -->
      <script type="application/ld+json">${JSON.stringify(buildJsonLd({
        url, title, description, images, authorName, publishedAt, updatedAt, keywords, videoSrc, articleBody: stripHtml(htmlContent)
      }))}</script>
    </head><body>
      <main style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:4rem auto;padding:1rem;">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <article class="article-content">${htmlContent}</article>
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

function isoDate(val) {
  if (!val) return undefined;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch (e) { return undefined; }
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildJsonLd(opts) {
  const { url, title, description, images, authorName, publishedAt, updatedAt, keywords, videoSrc } = opts || {};
  const origin = (() => { try { return new URL(url).origin; } catch (e) { return ''; } })();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
    'headline': title,
    'description': description,
    'image': images && images.length ? images : undefined,
    'author': { '@type': 'Person', 'name': authorName },
    'publisher': {
      '@type': 'Organization',
      'name': 'OpenTuwa',
      'logo': { '@type': 'ImageObject', 'url': origin ? (origin + '/img/logo.png') : undefined }
    },
    'datePublished': isoDate(publishedAt),
    'dateModified': isoDate(updatedAt),
    'keywords': keywords || undefined,
    'articleBody': stripHtml(description || '')
  };
  // add video object when available
  if (videoSrc) {
    const v = { '@type': 'VideoObject', 'name': title, 'description': description };
    v.contentUrl = videoSrc;
    v.embedUrl = videoSrc;
    // derive a sensible thumbnail
    if (/youtube\.com|youtu\.be/.test(videoSrc)) {
      // try to extract id
      const m = videoSrc.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
      if (m && m[1]) v.thumbnailUrl = [`https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`];
    }
    if (!v.thumbnailUrl && images && images.length) v.thumbnailUrl = [images[0]];
    if (isoDate(publishedAt)) v.uploadDate = isoDate(publishedAt);
    ld.video = v;
  }
  // remove undefined values by stringify-reparse trick
  return JSON.parse(JSON.stringify(ld));
}
