import { isBot } from '../_utils/bot-detector.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  if (!isBot(request)) {
    return context.next();
  }

  // ... same logic as above ...
  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, content_html, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    return context.next();
  }

  if (!article) {
    return context.next();
  }

  const title = article.title || 'Article';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  const pubDate = article.published_at || '';
  const content = (typeof article.content_html === 'string' && article.content_html.trim().length > 0) 
    ? article.content_html 
    : `<p class="lead text-lg text-tuwa-muted">${esc(desc)}</p>`;

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

  const innerHtml = `
    <div class="pt-32 pb-12 max-w-3xl mx-auto px-6">
      <article>
        <header class="mb-10">
          <div class="flex items-center gap-3 text-sm text-tuwa-muted mb-6">
            <span class="font-bold text-tuwa-accent tracking-widest uppercase">Article</span>
            <span>&bull;</span>
            <span>${pubDate ? new Date(pubDate).toLocaleDateString() : ''}</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-6 leading-tight">${esc(title)}</h1>
          <div class="flex items-center gap-4 border-b border-white/5 pb-8 mb-8">
            <div class="text-sm">
              <p class="font-bold text-white">${esc(author)}</p>
              <p class="text-tuwa-muted">Author</p>
            </div>
          </div>
        </header>

        ${image ? `
          <div class="mb-10 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <img src="${esc(image)}" alt="${esc(title)}" class="w-full h-auto object-cover" />
          </div>
        ` : ''}

        <div class="prose prose-invert prose-lg max-w-none text-tuwa-text prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight prose-a:text-tuwa-accent prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
          ${content}
        </div>
      </article>
    </div>
  `;

  const fullHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} | OpenTuwa</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'tuwa-muted': '#a1a1aa',
            'tuwa-accent': '#3b82f6',
            'tuwa-text': '#e1e1e1',
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

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
