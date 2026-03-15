import React from 'react';

// SEO Head Component for Article Pages
export function ArticleSEOHead({ article, author, canonicalUrl }) {
  const seoTitle = `${article.title} | OpenTuwa`;
  const seoDesc = article.seo_description || article.subtitle || article.excerpt || article.title;
  const imageUrl = article.image_url || 'https://opentuwa.com/assets/ui/web_1200.png';
  const publishedTime = article.published_at;
  const modifiedTime = article.updated_at || article.published_at;
  
  // Parse tags for article:tag
  let tagsArray = [];
  if (Array.isArray(article.tags)) tagsArray = article.tags;
  else if (typeof article.tags === 'string') tagsArray = article.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <>
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl || `https://opentuwa.com/articles/${article.slug}`} />
      
      {/* Title and Meta */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDesc} />
      <meta name="keywords" content={[...tagsArray, 'news', 'journalism', 'documentary', 'OpenTuwa'].join(', ')} />
      
      {/* Author */}
      <meta name="author" content={author?.name || article.author || 'OpenTuwa'} />
      
      {/* Article Meta Tags */}
      <meta property="article:published_time" content={publishedTime} />
      <meta property="article:modified_time" content={modifiedTime} />
      <meta property="article:expiration_time" content={article.expiration_date || ''} />
      <meta property="article:section" content={article.section || 'Articles'} />
      {tagsArray.map((tag, idx) => (
        <meta key={idx} property="article:tag" content={tag} />
      ))}
      
      {/* Open Graph */}
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={seoDesc} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonicalUrl || `https://opentuwa.com/articles/${article.slug}`} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={article.title} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="OpenTuwa" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={seoDesc} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={article.title} />
      <meta name="twitter:site" content="@opentuwa" />
      <meta name="twitter:creator" content={
        author?.author_twitter
          ? (author.author_twitter.startsWith('@') ? author.author_twitter : `@${author.author_twitter}`)
          : '@opentuwa'
      } />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="bingbot" content="index, follow" />
    </>
  );
}

// SEO Head Component for Homepage
export function HomeSEOHead() {
  return (
    <>
      <title>OpenTuwa | Independent Journalism & Documentaries</title>
      <meta name="description" content="Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis." />
      <meta name="keywords" content="news, journalism, documentaries, independent media, deep dive, analysis, OpenTuwa" />
      <meta name="author" content="OpenTuwa" />
      
      {/* Open Graph */}
      <meta property="og:title" content="OpenTuwa | Independent Journalism & Documentaries" />
      <meta property="og:description" content="Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://opentuwa.com" />
      <meta property="og:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta property="og:image:alt" content="OpenTuwa - Independent Journalism" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="OpenTuwa" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="OpenTuwa | Independent Journalism & Documentaries" />
      <meta name="twitter:description" content="Independent news and journalism covering stories that matter." />
      <meta name="twitter:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta name="twitter:image:alt" content="OpenTuwa - Independent Journalism" />
      <meta name="twitter:site" content="@opentuwa" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
    </>
  );
}

// SEO Head Component for Archive Page
export function ArchiveSEOHead() {
  return (
    <>
      <title>Archive | OpenTuwa</title>
      <meta name="description" content="A complete timeline of all articles, documentaries, and stories published on OpenTuwa." />
      <meta name="keywords" content="archive, articles, documentaries, OpenTuwa archive, news archive" />
      <meta name="author" content="OpenTuwa" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Archive | OpenTuwa" />
      <meta property="og:description" content="A complete timeline of all articles, documentaries, and stories published on OpenTuwa." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://opentuwa.com/archive" />
      <meta property="og:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta property="og:image:alt" content="OpenTuwa Archive" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="OpenTuwa" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Archive | OpenTuwa" />
      <meta name="twitter:description" content="A complete timeline of all articles, documentaries, and stories published on OpenTuwa." />
      <meta name="twitter:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta name="twitter:image:alt" content="OpenTuwa Archive" />
      <meta name="twitter:site" content="@opentuwa" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
    </>
  );
}

// SEO Head Component for About Page
export function AboutSEOHead() {
  return (
    <>
      <title>About OpenTuwa | Independent Journalism</title>
      <meta name="description" content="OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles." />
      <meta name="keywords" content="about OpenTuwa, independent journalism, news platform, documentary site" />
      <meta name="author" content="OpenTuwa" />
      
      {/* Open Graph */}
      <meta property="og:title" content="About OpenTuwa" />
      <meta property="og:description" content="OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://opentuwa.com/about" />
      <meta property="og:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta property="og:image:alt" content="About OpenTuwa" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="OpenTuwa" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="About OpenTuwa" />
      <meta name="twitter:description" content="OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas." />
      <meta name="twitter:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta name="twitter:image:alt" content="About OpenTuwa" />
      <meta name="twitter:site" content="@opentuwa" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
    </>
  );
}

// SEO Head Component for Legal Page
export function LegalSEOHead() {
  return (
    <>
      <title>Legal | OpenTuwa</title>
      <meta name="description" content="Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa." />
      <meta name="keywords" content="legal, terms of service, privacy policy, cookie policy, OpenTuwa legal" />
      <meta name="author" content="OpenTuwa" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Legal | OpenTuwa" />
      <meta property="og:description" content="Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://opentuwa.com/legal" />
      <meta property="og:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta property="og:image:alt" content="OpenTuwa Legal" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="OpenTuwa" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Legal | OpenTuwa" />
      <meta name="twitter:description" content="Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa." />
      <meta name="twitter:image" content="https://opentuwa.com/assets/ui/web_1200.png" />
      <meta name="twitter:image:alt" content="OpenTuwa Legal" />
      <meta name="twitter:site" content="@opentuwa" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
    </>
  );
}

