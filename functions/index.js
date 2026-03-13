export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    const tag = url.searchParams.get('tag');
    const siteUrl = url.origin;

    // Helper for common HTML shell
    const renderPage = (title, description, content, schema = {}, metaExtra = '') => {
      return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url.toString())}">
  <link rel="canonical" href="${escapeHtml(url.toString())}">
  ${metaExtra}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; margin-top: 0; }
    h1 { border-bottom: 1px solid #222; padding-bottom: 1.5rem; margin-bottom: 2rem; font-size: 2.5rem; letter-spacing: -0.02em; }
    article { margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #222; }
    article:last-child { border-bottom: none; }
    article h2 { margin-bottom: 0.75rem; font-size: 1.75rem; }
    article a { text-decoration: none; color: #fff; transition: color 0.2s; }
    article a:hover { color: #3b82f6; }
    .meta { font-size: 0.9rem; color: #888; margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
    .subtitle { font-size: 1.15rem; color: #aaa; margin: 0.5rem 0; line-height: 1.5; }
    .lead { font-size: 1.25rem; color: #ccc; margin-bottom: 2rem; }
    hr { border: 0; border-top: 1px solid #222; margin: 2rem 0; }
    a.read-more { color: #3b82f6; font-weight: 500; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/"><strong>OpenTuwa</strong></a>
      <a href="/archive">Archive</a>
      <a href="/about">About</a>
      <a href="/legal">Legal</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} OpenTuwa. All rights reserved.</p>
    <p>
      <a href="/">Home</a> | 
      <a href="/about">About</a> | 
      <a href="/legal">Legal</a>
    </p>
  </footer>
</body>
</html>`;
    };

    // Helper to render article list
    const renderArticleList = (articles) => {
      if (!articles || articles.length === 0) return '<p>No stories found matching your criteria.</p>';
      return articles.map(article => `
        <article>
          <h2><a href="/articles/${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h2>
          ${article.subtitle ? `<p class="subtitle">${escapeHtml(article.subtitle)}</p>` : ''}
          <div class="meta">
            ${article.published_at ? `<span>${new Date(article.published_at).toLocaleDateString()}</span>` : ''}
             &bull; <a href="/articles/${escapeHtml(article.slug)}" class="read-more">Read full story</a>
          </div>
        </article>
      `).join('');
    };

    // 2. Handle Homepage (Root /) - DEFAULT for ALL USERS
    if (!author && !tag && (url.pathname === '/' || url.pathname === '')) {
      let articles = [];
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20"
        ).all();
        articles = results || [];
      } catch (err) {
        console.error('DB Query failed:', err);
        // If DB fails, fallback to next (static assets)
        return context.next();
      }

      const title = "OpenTuwa - Open Source Knowledge Platform";
      const desc = "Discover stories, documentaries, and articles on OpenTuwa. Independent journalism and deep research.";
      
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'OpenTuwa',
        'url': siteUrl,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };

      const content = `
        <h1>Latest Stories</h1>
        <p class="lead">${escapeHtml(desc)}</p>
        <hr>
        ${renderArticleList(articles)}
      `;

      return new Response(renderPage(title, desc, content, websiteSchema), { 
        headers: { 'content-type': 'text/html; charset=utf-8' } 
      });
    }

    // 3. Handle Author Page - DEFAULT for ALL USERS
    if (author && author.trim() !== '') {
      let a = null;
      let articles = [];
      try {
        const { results } = await env.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(author).all();
        a = (results && results[0]) || null;
      } catch (e) {
        console.error('Author DB Query failed:', e);
      }
      
      const name = a?.name || author;
      const bio = a?.bio || `Articles by ${name}`;
      const avatar = a?.avatar_url || a?.avatar || a?.image_url || '';
      const social = a?.social_link || '';

      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20"
        ).bind(name).all();
        articles = results || [];
      } catch (e) {
        console.error('Author Articles Query failed:', e);
      }

      const profileSchema = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'mainEntity': {
            '@type': 'Person',
            'name': name,
            'description': bio,
            'image': avatar,
            'sameAs': social ? [social] : []
        }
      };

      const metaExtra = `
        ${avatar ? `<meta property="og:image" content="${escapeHtml(avatar)}">` : ''}
        <meta name="twitter:card" content="${avatar ? 'summary_large_image' : 'summary'}">
        <meta name="twitter:title" content="${escapeHtml(name)} | OpenTuwa">
        <meta name="twitter:description" content="${escapeHtml(bio)}">
        ${avatar ? `<meta name="twitter:image" content="${escapeHtml(avatar)}">` : ''}
      `;

      const content = `
        <h1>${escapeHtml(name)}</h1>
        <p class="lead">${escapeHtml(bio)}</p>
        <hr>
        <h2>Latest Stories</h2>
        ${renderArticleList(articles)}
      `;

      return new Response(renderPage(`${name} - Author Profile | OpenTuwa`, bio, content, profileSchema, metaExtra), { 
        headers: { 'content-type': 'text/html; charset=utf-8' } 
      });
    }

    // 4. Handle Tag Page - DEFAULT for ALL USERS
    if (tag && tag.trim() !== '') {
      const title = `${tag} - Topic | OpenTuwa`;
      const desc = `Latest stories, documentaries and articles about ${tag}. Insights and perspectives from the network.`;
      let articles = [];

      try {
        const wildcard = `%${tag}%`;
        const { results } = await env.DB.prepare(
          "SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20"
        ).bind(wildcard).all();
        articles = results || [];
      } catch (e) {
        console.error('Tag Articles Query failed:', e);
      }
      
      const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Stories about ${tag}`,
        'description': desc,
        'url': url.toString()
      };

      const metaExtra = `
        <meta property="og:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(title)}">
        <meta name="twitter:description" content="${escapeHtml(desc)}">
      `;

      const content = `
        <h1>Topic: ${escapeHtml(tag)}</h1>
        <p class="lead">${escapeHtml(desc)}</p>
        <hr>
        <h2>Latest Stories</h2>
        ${renderArticleList(articles)}
      `;

      return new Response(renderPage(title, desc, content, collectionSchema, metaExtra), { 
        headers: { 'content-type': 'text/html; charset=utf-8' } 
      });
    }

    // If no match (e.g. static assets, other routes), just proceed.
    return context.next();

  } catch (err) {
    console.error('Error in index function:', err);
    return context.next();
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
