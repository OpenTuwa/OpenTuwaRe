'use client';

import React from 'react';

// JSON-LD Structured Data for NewsArticle
export function NewsArticleSchema({ article, author }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.seo_description || article.subtitle || article.excerpt || article.title,
    'image': article.image_url ? [article.image_url] : [],
    'datePublished': article.published_at,
    'dateModified': article.updated_at || article.published_at,
    'author': author ? {
      '@type': 'Person',
      'name': author.name,
      'jobTitle': author.role || 'Journalist',
      'url': author.website || null
    } : {
      '@type': 'Organization',
      'name': 'OpenTuwa'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'OpenTuwa',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://opentuwa.com/assets/ui/web_512.png'
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// JSON-LD Organization Schema
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    'name': 'OpenTuwa',
    'description': 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.',
    'url': 'https://opentuwa.com',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://opentuwa.com/assets/ui/web_512.png',
      'width': '512',
      'height': '512'
    },
    'sameAs': [
      'https://twitter.com/opentuwa',
      'https://facebook.com/opentuwa',
      'https://instagram.com/opentuwa'
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// JSON-LD WebSite Schema
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'OpenTuwa',
    'url': 'https://opentuwa.com',
    'description': 'Independent news and journalism covering stories that matter.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://opentuwa.com/?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// JSON-LD BreadcrumbList Schema
export function BreadcrumbSchema({ article, isArticle = false }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://opentuwa.com'
      },
      ...(isArticle && article ? [{
        '@type': 'ListItem',
        'position': 2,
        'name': article.section || 'Articles',
        'item': 'https://opentuwa.com/articles'
      }, {
        '@type': 'ListItem',
        'position': 3,
        'name': article.title,
        'item': `https://opentuwa.com/articles/${article.slug}`
      }] : [{
        '@type': 'ListItem',
        'position': 2,
        'name': 'Archive',
        'item': 'https://opentuwa.com/archive'
      }])
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// JSON-LD CollectionPage Schema (for archive)
export function CollectionPageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'OpenTuwa Archive',
    'description': 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.',
    'url': 'https://opentuwa.com/archive'
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// JSON-LD VideoObject Schema (for articles with video)
export function VideoObjectSchema({ article, videoUrl }) {
  if (!videoUrl) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    'name': `${article.title} - Video`,
    'description': article.seo_description || article.subtitle || article.excerpt,
    'thumbnailUrl': article.image_url,
    'uploadDate': article.published_at,
    'duration': 'PT5M', // Default duration, should be calculated from actual video
    'contentUrl': videoUrl
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
