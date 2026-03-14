import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import ArticleView from '../../../components/ArticleView';
import { fetchCandidates, RecommendationEngine } from '../../../utils/algorithm';
import { NewsArticleSchema, OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '../../../components/StructuredData';
import { ArticleSEOHead } from '../../../components/SEOHead';

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

async function getAuthor(name, env) {
  if (!name) return null;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM authors WHERE name = ?").bind(name).all();
    return results && results.length > 0 ? results[0] : null;
  } catch (e) {
    return null;
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
    return {
      title: 'Article Not Found',
    };
  }

  const seoTitle = `${article.title} | OpenTuwa`;
  const seoDesc = article.seo_description || article.subtitle || article.excerpt || article.title;

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      title: article.title,
      description: seoDesc,
      type: 'article',
      url: `https://opentuwa.com/articles/${slug}`,
      images: article.image_url ? [article.image_url] : [],
      publishedTime: article.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: seoDesc,
      images: article.image_url ? [article.image_url] : [],
    }
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const { env } = getRequestContext();

  const article = await getArticle(slug, env);

  if (!article) {
    notFound();
  }

  const [authorInfo, recommended] = await Promise.all([
    getAuthor(article.author, env),
    getRecommendations(article, env)
  ]);

  return (
    <>
      <ArticleSEOHead article={article} author={authorInfo} canonicalUrl={`https://opentuwa.com/articles/${slug}`} />
      <NewsArticleSchema article={article} author={authorInfo} />
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema article={article} isArticle={true} />
      <ArticleView
        article={article}
        recommended={recommended}
        authorInfo={authorInfo}
      />
    </>
  );
}
