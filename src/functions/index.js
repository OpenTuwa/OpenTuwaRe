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

  // 2. Fetch the SPA Shell
  const response = await context.next();

  if (!response.headers.get('content-type')?.includes('text/html')) {
    // If not HTML, we can't hydrate. Return purely static.
    // (This shouldn't happen for valid routes if _redirects is correct)
    return new Response(`<!doctype html><html><body>${innerHtml}</body></html>`, { headers: { 'content-type': 'text/html' } });
  }

  // 3. Construct the Full Layout (Navbar + Content + Footer)
  // We reconstruct the Navbar HTML manually to match Navbar.jsx
  const navbarHtml = `
    <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-b border-white/5">
      <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <a class="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">OpenTuwa</a>
          <div class="hidden md:flex items-center space-x-6 text-sm font-medium text-tuwa-muted">
            <a href="/" class="hover:text-white transition-colors text-white">Stories</a>
            <a href="/archive" class="hover:text-white transition-colors">Archive</a>
            <a href="/about" class="hover:text-white transition-colors">About</a>
          </div>
        </div>
      </nav>
    </header>
  `;

  const footerHtml = `
    <footer class="py-12 px-6 border-t border-white/5 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="text-2xl font-extrabold tracking-tighter font-heading text-white">OpenTuwa</div>
        <div class="flex flex-wrap justify-center md:justify-end space-x-8 text-xs font-bold tracking-widest uppercase text-tuwa-muted">
          <a class="hover:text-white transition-colors" href="/legal">Terms & Privacy</a>
          <a class="hover:text-white transition-colors" href="/about">About OpenTuwa</a>
        </div>
        <div class="text-xs text-tuwa-muted">© 2026 OpenTuwa Media. All rights reserved.</div>
      </div>
    </footer>
  `;

  const fullHtml = `
    <div class="min-h-screen bg-[#0a0a0b] text-[#e1e1e1] font-sans antialiased selection:bg-tuwa-accent selection:text-white flex flex-col">
      ${navbarHtml}
      <main class="flex-grow">
        ${innerHtml}
      </main>
      ${footerHtml}
    </div>
  `;

  // 4. Inject Content (Hydration)
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
        e.setInnerContent(fullHtml, { html: true });
      }
    })
    .transform(response);
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
