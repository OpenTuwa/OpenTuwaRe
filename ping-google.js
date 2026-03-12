#!/usr/bin/env node
/**
 * OpenTuwa — Google + Cloudflare Sitemap Pinger
 * 
 * Run this every time you post or update an article:
 *   node ping-google.js
 * 
 * Or add to package.json scripts:
 *   "ping": "node ping-google.js"
 *   then run: npm run ping
 * 
 * SETUP: Fill in your values in the CONFIG section below.
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const CONFIG = {
  // Your site URL (no trailing slash)
  siteUrl: 'https://opentuwa.com',

  // Cloudflare Account ID
  // Find it: Cloudflare Dashboard → right sidebar → Account ID
  cfAccountId: '20f673faa71507381f3edccb2c16bfd3',

  // Cloudflare API Token
  // Create it: Cloudflare Dashboard → My Profile → API Tokens
  // → Create Token → "Edit Cloudflare Workers" template is enough
  cfApiToken: 'itords9NCbJuaUxYfdJZoaJz-MguMEnVvsT9dkYF',

  // D1 Database ID
  // Find it: Cloudflare Dashboard → D1 → your database → Database ID
  cfD1DatabaseId: '5494913d-dde9-48ae-82a4-5774ed2b11a6', // already in your wrangler.toml

  // Cloudflare Zone ID (for cache purge)
  // Find it: Cloudflare Dashboard → your domain → right sidebar → Zone ID
  cfZoneId: '85d91671600710d1aa28124dd662fc09',
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 OpenTuwa Sitemap Pinger\n');

  // 1. Fetch all slugs from D1
  const slugs = await fetchSlugsFromD1();
  if (!slugs.length) {
    console.error('❌ No articles found in D1. Check your config.');
    process.exit(1);
  }
  console.log(`✅ Found ${slugs.length} articles in D1\n`);

  // 2. Purge Cloudflare cache for sitemap files so Google gets fresh data
  await purgeCloudflareCache();

  // 3. Ping Google with all 3 sitemaps
  await pingGoogle();

  // 4. Print all article URLs (so you can see what Google will find)
  console.log('\n📋 Article URLs Google will discover:\n');
  slugs.forEach(slug => {
    console.log(`   ${CONFIG.siteUrl}/articles/${slug}`);
  });

  console.log('\n✅ Done! Google will crawl your sitemaps within 24–48 hours.\n');
}

// ─── FUNCTIONS ────────────────────────────────────────────────────────────────

async function fetchSlugsFromD1() {
  console.log('📦 Querying D1 for all article slugs...');
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CONFIG.cfAccountId}/d1/database/${CONFIG.cfD1DatabaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.cfApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'SELECT slug, title, published_at FROM articles ORDER BY published_at DESC',
        }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      console.error('❌ D1 query failed:', JSON.stringify(data.errors));
      return [];
    }

    const rows = data.result?.[0]?.results || [];
    rows.forEach(r => {
      console.log(`   • ${r.title} (${r.slug})`);
    });

    return rows.map(r => r.slug);
  } catch (err) {
    console.error('❌ D1 fetch error:', err.message);
    return [];
  }
}

async function purgeCloudflareCache() {
  console.log('\n🧹 Purging Cloudflare cache for sitemaps...');
  const urlsToPurge = [
    `${CONFIG.siteUrl}/sitemap.xml`,
    `${CONFIG.siteUrl}/news-sitemap.xml`,
    `${CONFIG.siteUrl}/feed.xml`,
    `${CONFIG.siteUrl}/robots.txt`,
  ];

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CONFIG.cfZoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.cfApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: urlsToPurge }),
      }
    );

    const data = await res.json();
    if (data.success) {
      console.log('   ✅ Cache purged for:');
      urlsToPurge.forEach(u => console.log(`      ${u}`));
    } else {
      console.warn('   ⚠️  Cache purge failed (non-critical):', JSON.stringify(data.errors));
    }
  } catch (err) {
    console.warn('   ⚠️  Cache purge error (non-critical):', err.message);
  }
}

async function pingGoogle() {
  console.log('\n📡 Pinging Google with your sitemaps...');
  const sitemaps = [
    `${CONFIG.siteUrl}/sitemap.xml`,
    `${CONFIG.siteUrl}/news-sitemap.xml`,
  ];

  for (const sitemap of sitemaps) {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`;
      const res = await fetch(pingUrl);
      if (res.ok) {
        console.log(`   ✅ Google pinged: ${sitemap}`);
      } else {
        console.warn(`   ⚠️  Google ping returned ${res.status} for ${sitemap}`);
      }
    } catch (err) {
      console.warn(`   ⚠️  Google ping failed for ${sitemap}:`, err.message);
    }
  }
}

// ─── RUN ──────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
