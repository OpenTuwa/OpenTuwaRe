import { isBot } from './_utils/bot-detector.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // 1. Check if it's a bot using the new utility
  if (!isBot(request)) {
    return context.next();
  }

  try {
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    const tag = url.searchParams.get('tag');

    // 2. Handle Homepage (Root /) for Bots
    if (!author && !tag && (url.pathname === '/' || url.pathname === '')) {
      let articles = [];
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20"
        ).all();
        articles = results || [];
      } catch (err) {
        console.error('DB Query failed:', err);
        // Graceful fallback
        return context.next();
      }

      const title = "OpenTuwa - Open Source Knowledge Platform";
      const desc = "Discover stories, documentaries, and articles on OpenTuwa.";
      const urlStr = url.origin;

      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'OpenTuwa',
        'url': urlStr,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${urlStr}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };

      const html = `<!doctype html><html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(urlStr)}">
  <link rel="canonical" href="${escapeHtml(urlStr)}">
  <script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>
</head>
<body>
  <main style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(desc)}</p>
    <nav>
      <ul>
        ${articles.map(article => `
          <li>
            <a href="/articles/${escapeHtml(article.slug)}">
              <strong>${escapeHtml(article.title)}</strong>
            </a>
            ${article.subtitle ? `<br><small>${escapeHtml(article.subtitle)}</small>` : ''}
            ${article.published_at ? `<br><small>${new Date(article.published_at).toLocaleDateString()}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </nav>
  </main>
</body>
</html>`;
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    // 3. Handle Author Page for Bots
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

      // Fetch articles for this author to make the page meaningful for bots
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20"
        ).bind(name).all();
        articles = results || [];
      } catch (e) {
        console.error('Author Articles Query failed:', e);
      }

      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'OpenTuwa',
        'url': url.origin,
        'logo': { '@type': 'ImageObject', 'url': `${url.origin}/img/logo.png` }
      };

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

      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escapeHtml(name)} - Author Profile | OpenTuwa</title>
        <meta name="description" content="${escapeHtml(bio)}">
        <meta property="og:type" content="profile">
        <meta property="og:title" content="${escapeHtml(name)} - Author Profile | OpenTuwa">
        <meta property="og:description" content="${escapeHtml(bio)}">
        ${avatar ? `<meta property="og:image" content="${escapeHtml(avatar)}">` : ''}
        <meta property="og:url" content="${escapeHtml(url.toString())}">
        <meta name="twitter:card" content="${avatar ? 'summary_large_image' : 'summary'}">
        <meta name="twitter:title" content="${escapeHtml(name)} | OpenTuwa">
        <meta name="twitter:description" content="${escapeHtml(bio)}">
        ${avatar ? `<meta name="twitter:image" content="${escapeHtml(avatar)}">` : ''}
        <link rel="canonical" href="${escapeHtml(url.toString())}">
        <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">${JSON.stringify(profileSchema)}</script>
      </head><body>
        <main style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(bio)}</p>
          <hr>
          <h2>Latest Stories</h2>
          <ul>
            ${articles.map(article => `
              <li>
                <a href="/articles/${escapeHtml(article.slug)}">
                  <strong>${escapeHtml(article.title)}</strong>
                </a>
                ${article.subtitle ? `<br><small>${escapeHtml(article.subtitle)}</small>` : ''}
                ${article.published_at ? `<br><small>${new Date(article.published_at).toLocaleDateString()}</small>` : ''}
              </li>
            `).join('')}
          </ul>
          ${articles.length === 0 ? '<p>No stories found.</p>' : ''}
        </main>
      </body></html>`;

      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    // 4. Handle Tag Page for Bots
    if (tag && tag.trim() !== '') {
      const title = `${tag} - Topic | OpenTuwa`;
      const desc = `Latest stories, documentaries and articles about ${tag}`;
      const urlStr = url.toString();
      let articles = [];

      // Fetch articles for this tag
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
        'url': urlStr
      };

      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <meta name="description" content="${escapeHtml(desc)}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(desc)}">
        <meta property="og:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop">
        <meta property="og:url" content="${escapeHtml(urlStr)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(title)}">
        <meta name="twitter:description" content="${escapeHtml(desc)}">
        <link rel="canonical" href="${escapeHtml(urlStr)}">
        <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
      </head><body>
        <main style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
          <h1>Topic: ${escapeHtml(tag)}</h1>
          <p>${escapeHtml(desc)}</p>
          <hr>
          <h2>Latest Stories</h2>
          <ul>
            ${articles.map(article => `
              <li>
                <a href="/articles/${escapeHtml(article.slug)}">
                  <strong>${escapeHtml(article.title)}</strong>
                </a>
                ${article.subtitle ? `<br><small>${escapeHtml(article.subtitle)}</small>` : ''}
                ${article.published_at ? `<br><small>${new Date(article.published_at).toLocaleDateString()}</small>` : ''}
              </li>
            `).join('')}
          </ul>
          ${articles.length === 0 ? '<p>No stories found.</p>' : ''}
        </main>
      </body></html>`;

      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    // If no match (and somehow passed through), just proceed.
    return context.next();

  } catch (err) {
    console.error('Error in index function:', err);
    // Fallback to static asset if anything fails
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
