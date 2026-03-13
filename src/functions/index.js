import { isBot } from './_utils/bot-detector.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  if (!isBot(request)) {
    return context.next();
  }

  // Same content as above
  const url = new URL(request.url);
  const author = url.searchParams.get('author');
  const tag = url.searchParams.get('tag');
  
  let articles = [];
  let pageTitle = "OpenTuwa - Open Source Knowledge Platform";
  let pageDesc = "Discover stories, documentaries, and articles on OpenTuwa. Independent journalism and deep research.";
  let innerHtml = "";

  try {
    if (author && author.trim() !== '') {
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
        <div class="pt-32 pb-12 max-w-7xl mx-auto px-6">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-4">${escapeHtml(name)}</h1>
          <p class="text-lg text-tuwa-muted max-w-2xl mb-12">${escapeHtml(pageDesc)}</p>
          <div class="border-t border-white/5 my-12"></div>
          <h2 class="text-2xl font-bold text-white mb-8">Latest Stories</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${renderArticleList(articles)}
          </div>
        </div>
      `;

    } else if (tag && tag.trim() !== '') {
      pageTitle = `${tag} - Topic | OpenTuwa`;
      pageDesc = `Latest stories, documentaries and articles about ${tag}.`;
      
      const wildcard = `%${tag}%`;
      const { results } = await env.DB.prepare(
        "SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20"
      ).bind(wildcard).all();
      articles = results || [];

      innerHtml = `
        <div class="pt-32 pb-12 max-w-7xl mx-auto px-6">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-4">Topic: ${escapeHtml(tag)}</h1>
          <p class="text-lg text-tuwa-muted max-w-2xl mb-12">${escapeHtml(pageDesc)}</p>
          <div class="border-t border-white/5 my-12"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${renderArticleList(articles)}
          </div>
        </div>
      `;

    } else if (url.pathname === '/' || url.pathname === '') {
      const { results } = await env.DB.prepare(
        "SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20"
      ).all();
      articles = results || [];

      innerHtml = `
        <div class="pt-32 pb-12 max-w-7xl mx-auto px-6">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-4">Latest Stories</h1>
          <p class="text-lg text-tuwa-muted max-w-2xl mb-12">${escapeHtml(pageDesc)}</p>
          <div class="border-t border-white/5 my-12"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${renderArticleList(articles)}
          </div>
        </div>
      `;
    } else {
      return context.next();
    }

  } catch (err) {
    return context.next();
  }

  const navbarHtml = `
    <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-b border-white/5">
      <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <a class="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">OpenTuwa</a>
        </div>
      </nav>
    </header>
  `;

  const footerHtml = `
    <footer class="py-12 px-6 border-t border-white/5 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="text-2xl font-extrabold tracking-tighter font-heading text-white">OpenTuwa</div>
        <div class="text-xs text-tuwa-muted">© 2026 OpenTuwa Media. All rights reserved.</div>
      </div>
    </footer>
  `;

  const fullHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDesc)}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'tuwa-muted': '#a1a1aa',
            'tuwa-accent': '#3b82f6',
          },
          fontFamily: {
            heading: ['Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#0a0a0b] text-[#e1e1e1] font-sans antialiased">
  <div class="min-h-screen flex flex-col">
    ${navbarHtml}
    <main class="flex-grow">
      ${innerHtml}
    </main>
    ${footerHtml}
  </div>
</body>
</html>`;

  return new Response(fullHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function renderArticleList(articles) {
  if (!articles || articles.length === 0) return '<p>No stories found.</p>';
  return articles.map(article => `
    <article class="flex flex-col h-full p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group">
      <div class="mb-4">
        <span class="text-xs font-bold tracking-widest uppercase text-tuwa-accent">Article</span>
      </div>
      <h2 class="text-xl font-bold text-white mb-3 group-hover:text-tuwa-accent transition-colors line-clamp-2">
        <a href="/articles/${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a>
      </h2>
      ${article.subtitle ? `<p class="text-sm text-tuwa-muted mb-4 line-clamp-3 flex-grow">${escapeHtml(article.subtitle)}</p>` : '<div class="flex-grow"></div>'}
      <div class="flex items-center justify-between text-xs text-tuwa-muted mt-4 pt-4 border-t border-white/5">
        <span>${article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}</span>
        <a href="/articles/${escapeHtml(article.slug)}" class="font-medium text-white group-hover:text-tuwa-accent transition-colors">Read Story &rarr;</a>
      </div>
    </article>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
