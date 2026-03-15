import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const SITE_URL = 'https://opentuwa.com';

// Real dates — update when content of these pages changes
const STATIC_PAGES = [
  { path: '/',        lastmod: '2025-01-01', changefreq: 'daily',   priority: '1.0' },
  { path: '/about',   lastmod: '2025-01-01', changefreq: 'monthly', priority: '0.6' },
  { path: '/archive', lastmod: '2025-01-01', changefreq: 'daily',   priority: '0.7' },
  { path: '/legal',   lastmod: '2025-01-01', changefreq: 'yearly',  priority: '0.3' },
];

function articleChangefreq(publishedAt) {
  if (!publishedAt) return 'monthly';
  const days = (Date.now() - new Date(publishedAt).getTime()) / 86400000;
  if (days <= 30)  return 'daily';
  if (days <= 365) return 'weekly';
  return 'monthly';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toISO(val) {
  if (!val) return '';
  try { const d = new Date(val); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch { return ''; }
}

export async function GET() {
  let articles = [];
  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare(
      'SELECT slug, published_at, updated_at, image_url, title, seo_description FROM articles ORDER BY published_at DESC'
    ).all();
    articles = results || [];
  } catch { articles = []; }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  for (const page of STATIC_PAGES) {
    xml += `
  <url>
    <loc>${esc(SITE_URL + page.path)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  for (const a of articles) {
    const lastmod = toISO(a.updated_at || a.published_at);
    const imageUrl = a.image_url
      ? (a.image_url.startsWith('http') ? a.image_url : SITE_URL + a.image_url)
      : '';
    const caption = a.seo_description || a.title || '';

    xml += `
  <url>
    <loc>${esc(SITE_URL + '/articles/' + a.slug)}</loc>${lastmod ? `
    <lastmod>${esc(lastmod)}</lastmod>` : ''}
    <changefreq>${articleChangefreq(a.published_at)}</changefreq>
    <priority>0.8</priority>${imageUrl ? `
    <image:image>
      <image:loc>${esc(imageUrl)}</image:loc>
      <image:title>${esc(a.title || '')}</image:title>
      <image:caption>${esc(caption)}</image:caption>
    </image:image>` : ''}
  </url>`;
  }

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
