'use client';

import React from 'react';
import Link from 'next/link';
import useScrollReveal from '../hooks/useScrollReveal';
import SkeletonImage from './SkeletonImage';

export default function ArticleCard({ article, index = 0 }) {
  const ref = useScrollReveal();
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  // FIX: Strict null check to prevent .split of undefined/null
  const tag = article.tags ? article.tags.split(',')[0].trim() : null;

  return (
    <Link
      ref={ref}
      // FIX: Removed trailing '?' in href
      href={`/articles/${article.slug}`}
      className="reveal group block"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="w-full h-64 rounded-xl overflow-hidden mb-5 relative bg-tuwa-gray border border-white/5">
        <SkeletonImage
          src={article.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'}
          alt={article.title || 'Article thumbnail'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <div className="transition-transform duration-300 group-hover:-translate-y-1">
        <h2 className="text-2xl font-bold font-heading mb-2 group-hover:text-tuwa-accent transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-tuwa-muted text-sm line-clamp-2 mb-3">{article.subtitle}</p>
        <div className="flex items-center gap-3 text-xs text-tuwa-muted">
          {article.author && <span>{article.author}</span>}
          {date && <><span className="opacity-40">·</span><span>{date}</span></>}
          {article.read_time_minutes && <><span className="opacity-40">·</span><span>{article.read_time_minutes} min read</span></>}
          {tag && (
            <>
              <span className="opacity-40">·</span>
              <span className="px-2 py-0.5 rounded-full border border-white/10 text-[10px] uppercase tracking-wider font-bold">{tag}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
