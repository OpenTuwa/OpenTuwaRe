import { isBot } from './_utils/bot-detector.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // 1. If it's a real user, serve the SPA shell immediately.
  // This guarantees your UI stays intact and functional for humans.
  if (!isBot(request)) {
    return context.next();
  }

  // 2. SSR Logic ONLY for Bots. 
  // We serve a self-contained HTML page with INLINE CSS to avoid "Naked" rendering.
  const url = new URL(request.url);
  const author = url.searchParams.get('author');
  const tag = url.searchParams.get('tag');
  
  let articles = [];
  let pageTitle = "OpenTuwa - Independent Journalism & Documentaries";
  let pageDesc = "Discover stories, documentaries, and articles on OpenTuwa. Substantive journalism and rigorous intellectual inquiry.";
  let innerHtml = "";

  try {
    if (author && author.trim() !== '') {
      let a = null;
      try {
        const { results } = await env.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(author).all();
        a = (results && results[0]) || null;
      } catch (e) {}
      const name = a?.name || author;
      pageTitle = `${name} | OpenTuwa Author`;
      pageDesc = a?.bio || `Read articles and stories by ${name} on OpenTuwa.`;
      const { results } = await env.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20").bind(name).all();
      articles = results || [];
      innerHtml = `<h1>${escapeHtml(name)}</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/><h2>Latest Stories</h2>${renderArticleList(articles)}`;
    } else if (tag && tag.trim() !== '') {
      pageTitle = `${tag} - Topic | OpenTuwa`;
      pageDesc = `Latest stories, documentaries and articles about ${tag}.`;
      const { results } = await env.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20").bind(`%${tag}%`).all();
      articles = results || [];
      innerHtml = `<h1>Topic: ${escapeHtml(tag)}</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/>${renderArticleList(articles)}`;
    } else {
      const { results } = await env.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20").all();
      articles = results || [];
      innerHtml = `<h1>Latest Stories</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/>${renderArticleList(articles)}`;
    }
  } catch (err) {
    return context.next();
  }

  // Self-contained Bot HTML with Inline Styles
  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <meta property="og:title" content="OpenTuwa | Independent Journalism &amp; Documentaries">
  <meta property="og:description" content="Independent news and journalism covering stories that matter.">
  <meta property="og:image" content="https://opentuwa.com/assets/ui/web_512.png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opentuwa.com">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="OpenTuwa | Independent Journalism &amp; Documentaries">
  <meta name="twitter:description" content="Independent news and journalism covering stories that matter.">
  <meta name="twitter:image" content="https://opentuwa.com/assets/ui/web_512.png">
  <meta name="twitter:site" content="@opentuwa">
  <link rel="canonical" href="https://opentuwa.com">
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; }
    main { max-width: 800px; margin: 0 auto; }
    h1 { color: #fff; font-size: 2.5rem; margin-bottom: 1rem; }
    h2 { color: #fff; margin-top: 2rem; }
    .lead { font-size: 1.25rem; color: var(--muted); margin-bottom: 2rem; }
    article { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #222; }
    article h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    article a { color: #fff; text-decoration: none; }
    article a:hover { color: var(--accent); }
    .meta { font-size: 0.875rem; color: var(--muted); }
    hr { border: 0; border-top: 1px solid #222; margin: 2rem 0; }
  </style>
</head>
<body>
  <main>
    <nav><a href="/" style="color:#fff; font-weight:bold; text-decoration:none; font-size:1.5rem;">OpenTuwa</a></nav>
    ${innerHtml}
    <footer style="margin-top:4rem; font-size:0.8rem; color:var(--muted);">
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media. <a href="/legal" style="color:var(--muted);">Legal</a> | <a href="/about" style="color:var(--muted);">About</a></p>
    </footer>
  </main>
</body>
</html>`;

  return new Response(botHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function renderArticleList(articles) {
  if (!articles || articles.length === 0) return '<p>No stories found.</p>';
  return articles.map(article => `
    <article>
      <h3><a href="/articles/${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h3>
      ${article.subtitle ? `<p>${escapeHtml(article.subtitle)}</p>` : ''}
      <div class="meta">${article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}</div>
    </article>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
