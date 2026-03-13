export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const author = url.searchParams.get('author');
  const tag = url.searchParams.get('tag');
  
  // 1. Fetch Data
  let articles = [];
  let pageTitle = "OpenTuwa - Open Source Knowledge Platform";
  let pageDesc = "Discover stories, documentaries, and articles on OpenTuwa. Independent journalism and deep research.";
  let innerHtml = "";

  try {
    if (author && author.trim() !== '') {
      // Author Page Logic
      let a = null;
      try {
        const { results } = await env.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(author).all();
        a = (results && results[0]) || null;
      } catch (e) {}
      
      const name = a?.name || author;
      pageTitle = `${name} - Author Profile | OpenTuwa`;
      pageDesc = a?.bio || `Articles by ${name}`;
      
      const { results } = await env.DB.prepare(
        "SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20"
      ).bind(name).all();
      articles = results || [];

      innerHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
          <h1>${escapeHtml(name)}</h1>
          <p class="lead">${escapeHtml(pageDesc)}</p>
          <hr style="border: 0; border-top: 1px solid #222; margin: 2rem 0;">
          <h2>Latest Stories</h2>
          ${renderArticleList(articles)}
        </main>
      `;

    } else if (tag && tag.trim() !== '') {
      // Tag Page Logic
      pageTitle = `${tag} - Topic | OpenTuwa`;
      pageDesc = `Latest stories, documentaries and articles about ${tag}.`;
      
      const wildcard = `%${tag}%`;
      const { results } = await env.DB.prepare(
        "SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20"
      ).bind(wildcard).all();
      articles = results || [];

      innerHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
          <h1>Topic: ${escapeHtml(tag)}</h1>
          <p class="lead">${escapeHtml(pageDesc)}</p>
          <hr style="border: 0; border-top: 1px solid #222; margin: 2rem 0;">
          <h2>Latest Stories</h2>
          ${renderArticleList(articles)}
        </main>
      `;

    } else if (url.pathname === '/' || url.pathname === '') {
      // Home Page Logic
      const { results } = await env.DB.prepare(
        "SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20"
      ).all();
      articles = results || [];

      innerHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
          <h1>Latest Stories</h1>
          <p class="lead">${escapeHtml(pageDesc)}</p>
          <hr style="border: 0; border-top: 1px solid #222; margin: 2rem 0;">
          ${renderArticleList(articles)}
        </main>
      `;
    } else {
      // Unknown route (e.g. static asset that wasn't caught?)
      return context.next();
    }

  } catch (err) {
    console.error('DB Error:', err);
    // Fallback to static shell if DB fails
    return context.next();
  }

  // 2. Fetch the SPA Shell (index.html)
  const response = await context.next();

  // If the next handler didn't return HTML (e.g. 404 or something else), return our own
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return new Response(makeFallbackHtml(pageTitle, pageDesc, innerHtml), {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }

  // 3. Inject Content (Hydration)
  return new HTMLRewriter()
    .on('title', {
      element(e) { e.setInnerContent(pageTitle); }
    })
    .on('meta[name="description"]', {
      element(e) { e.setAttribute('content', pageDesc); }
    })
    .on('head', {
      element(e) {
        e.append(`<meta property="og:title" content="${escapeHtml(pageTitle)}">`, { html: true });
        e.append(`<meta property="og:description" content="${escapeHtml(pageDesc)}">`, { html: true });
      }
    })
    .on('div#root', {
      element(e) {
        e.setInnerContent(innerHtml, { html: true });
      }
    })
    .transform(response);
}

function renderArticleList(articles) {
  if (!articles || articles.length === 0) return '<p>No stories found.</p>';
  return articles.map(article => `
    <article style="margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #222;">
      <h2 style="margin-bottom: 0.75rem; font-size: 1.75rem;">
        <a href="/articles/${escapeHtml(article.slug)}" style="text-decoration: none; color: #fff;">${escapeHtml(article.title)}</a>
      </h2>
      ${article.subtitle ? `<p style="font-size: 1.15rem; color: #aaa; margin: 0.5rem 0;">${escapeHtml(article.subtitle)}</p>` : ''}
      <div style="font-size: 0.9rem; color: #888; margin-top: 0.75rem;">
        ${article.published_at ? `<span>${new Date(article.published_at).toLocaleDateString()}</span>` : ''}
         &bull; <a href="/articles/${escapeHtml(article.slug)}" style="color: #3b82f6;">Read full story</a>
      </div>
    </article>
  `).join('');
}

function makeFallbackHtml(title, desc, content) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<style>body{background:#0a0a0b;color:#e1e1e1;font-family:sans-serif}</style>
</head>
<body><div id="root">${content}</div></body></html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
