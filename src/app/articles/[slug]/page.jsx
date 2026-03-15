import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import ArticleView from '../../../components/ArticleView';
import { fetchCandidates, RecommendationEngine } from '../../../utils/algorithm';
import GraphSchema from '../../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../../functions/_utils/hreflang.js';

export const runtime = 'edge';

async function getArticle(slug, env) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).all();
    return results && results.length > 0 ? results[0] : null;
  } catch (e) {
    console.error('Error fetching article:', e);
    return null;
  }
}

async function getCuratedRelated(article, env) {
  try {
    const raw = article?.related_articles;
    const slugs = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(slugs) || slugs.length === 0) return [];
    const placeholders = slugs.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT slug, title FROM articles WHERE slug IN (${placeholders}) LIMIT 20`
    ).bind(...slugs).all();
    const bySlug = Object.fromEntries((results || []).map(r => [r.slug, r]));
    return slugs.map(s => bySlug[s]).filter(Boolean);
  } catch (_) {
    return [];
  }
}

async function getAuthor(name, env) {
  if (!name) return null;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM authors WHERE name = ?").bind(name).all();
    return results && results.length > 0 ? results[0] : null;
  } catch (e) {
    return null;
  }
}

async function getSiloArticles(article, env) {
  try {
    const categoryFilter = article?.category_slug || article?.category || article?.section;
    if (!categoryFilter) return [];
    const col = article.category_slug ? 'category_slug' : (article.category ? 'category' : 'section');
    const { results } = await env.DB.prepare(
      `SELECT slug, title, image_url, published_at FROM articles WHERE ${col} = ? AND slug != ? ORDER BY published_at DESC LIMIT 3`
    ).bind(categoryFilter, article.slug).all();
    return results || [];
  } catch (_) {
    return [];
  }
}

async function getRecommendations(article, env) {
  try {
    // Parse article's neural_vector to use as user vector
    let userVector = null;
    if (article.neural_vector) {
      try {
        const parsed = typeof article.neural_vector === 'string' ? JSON.parse(article.neural_vector) : article.neural_vector;
        if (Array.isArray(parsed) && parsed.length === 768) userVector = parsed;
      } catch(e) {}
    }

    // Fetch candidates from D1 (includes pre-computed vectors as JSON)
    const candidates = await fetchCandidates(env, 100, null);
    if (!candidates || candidates.length === 0) return [];

    const engine = new RecommendationEngine(candidates);

    // Use new API: pass userVector directly, engine does in-memory cosine similarity
    const recommendations = engine.getHybridRecommendations(userVector, 8, article.slug, 0);

    return recommendations;
  } catch (e) {
    console.error('Error fetching recommendations:', e);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let article = null;
  try {
     const { env } = getRequestContext();
     article = await getArticle(slug, env);
  } catch (e) {
     console.error(e);
  }

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const seoTitle = `${article.title} | OpenTuwa`;
  const seoDesc = article.seo_description || article.subtitle || article.excerpt || article.title;
  const imageUrl = article.image_url || 'https://opentuwa.com/assets/ui/web_1200.png';
  const imageWidth = article.image_url ? 1200 : 1200;
  const imageHeight = article.image_url ? 630 : 630;
  const canonicalUrl = `https://opentuwa.com/articles/${slug}`;

  // Parse available_translations defensively
  let availableTranslations = null;
  if (article.available_translations) {
    try {
      availableTranslations = typeof article.available_translations === 'string'
        ? JSON.parse(article.available_translations)
        : article.available_translations;
    } catch (_) {}
  }

  const languages = buildHreflangLanguages(canonicalUrl, availableTranslations);

  let tagsArray = [];
  if (Array.isArray(article.tags)) tagsArray = article.tags;
  else if (typeof article.tags === 'string') tagsArray = article.tags.split(',').map(t => t.trim()).filter(Boolean);

  // Merge special_issue into keywords and OG tags
  const specialIssue = article.special_issue?.trim() || null;
  const allTags = specialIssue ? [...tagsArray, specialIssue] : tagsArray;

  return {
    title: seoTitle,
    description: seoDesc,
    keywords: [...allTags, 'news', 'journalism', 'documentary', 'OpenTuwa'].join(', '),
    authors: [{ name: article.author || 'OpenTuwa' }],
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, googleBot: { index: true, follow: true } },
    openGraph: {
      title: article.title,
      description: seoDesc,
      type: 'article',
      url: canonicalUrl,
      images: [{ url: imageUrl, alt: article.title, width: imageWidth, height: imageHeight }],
      siteName: 'OpenTuwa',
      locale: 'en_US',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at || article.published_at,
      section: article.section || 'Articles',
      tags: allTags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: seoDesc,
      images: [{ url: imageUrl, alt: article.title }],
      site: '@opentuwa',
      creator: article.author_twitter
        ? (article.author_twitter.startsWith('@') ? article.author_twitter : `@${article.author_twitter}`)
        : '@opentuwa',
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const { env } = getRequestContext();

  const article = await getArticle(slug, env);

  if (!article) {
    notFound();
  }

  const [authorInfo, recommended, siloArticles, curatedRelated] = await Promise.all([
    getAuthor(article.author, env),
    getRecommendations(article, env),
    getSiloArticles(article, env),
    getCuratedRelated(article, env),
  ]);

  const siloLinks = siloArticles
    .filter(r => r?.slug)
    .map(r => `https://opentuwa.com/articles/${r.slug}`);

  const curatedLinks = curatedRelated.map(r => `https://opentuwa.com/articles/${r.slug}`);
  const allRelatedLinks = [...new Set([...curatedLinks, ...siloLinks])];

  // Append editor-curated "Related Articles" block to content_html
  let contentHtml = article.content_html || '';
  if (curatedRelated.length > 0) {
    const listItems = curatedRelated
      .map(r => `<li><em><a href="/articles/${r.slug}">${r.title || r.slug}</a></em></li>`)
      .join('');
    contentHtml += `<hr style="margin:2rem 0;border-color:rgba(255,255,255,0.08)"><p><strong>Related Articles</strong></p><ul>${listItems}</ul>`;
  }

  return (
    <>
      {article.image_url && (
        <link rel="preload" as="image" href={article.image_url} fetchPriority="high" />
      )}
      {allRelatedLinks.map(url => (
        <link key={url} rel="related" href={url} />
      ))}
      <GraphSchema type="article" data={{ ...article, relatedLinks: allRelatedLinks }} />
      <ArticleView
        article={{ ...article, content_html: contentHtml }}
        recommended={recommended}
        authorInfo={authorInfo}
        furtherReading={siloArticles}
      />
    </>
  );
}
