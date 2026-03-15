'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SkeletonImage from './SkeletonImage';

export default function HeroStory({ articles }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!articles || articles.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % articles.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [articles]);

  if (!articles || articles.length === 0) return null;

  const article = articles[index];
  const primaryTag = article.tags?.split(',')[0]?.trim();
  const hasImage = Boolean(article.image_url);

  return (
    <div className="relative w-full h-[320px] md:h-[560px] overflow-hidden bg-tuwa-gray">
      {/* Slides */}
      {articles.map((a, i) => {
        const aHasImage = Boolean(a.image_url);
        return (
          <div
            key={a.slug}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
          >
            {aHasImage ? (
              <SkeletonImage
                src={a.image_url}
                alt={a.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-tuwa-gray" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        );
      })}

      {/* Text overlay — always on top */}
      <Link
        href={`/articles/${article.slug}`}
        className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
      >
        <div className="max-w-3xl">
          {primaryTag && (
            <span className="inline-block mb-3 px-2 py-0.5 bg-tuwa-accent text-white text-xs font-bold uppercase tracking-wider rounded">
              {primaryTag}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight mb-3">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-tuwa-muted text-base md:text-lg line-clamp-2 mb-3">
              {article.subtitle}
            </p>
          )}
          {(article.author_name || article.author || article.published_at) && (
            <p className="text-tuwa-muted text-sm">
              {(article.author_name || article.author) && (
                <span>{article.author_name || article.author}</span>
              )}
              {(article.author_name || article.author) && article.published_at && (
                <span className="mx-2 opacity-40">·</span>
              )}
              {article.published_at && (
                <span>
                  {new Date(article.published_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </p>
          )}
        </div>
      </Link>

      {/* Progress indicators — subtle dots, no user interaction */}
      {articles.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5 pointer-events-none">
          {articles.map((_, i) => (
            <span
              key={i}
              className="block h-[2px] w-6 rounded-full transition-all duration-500"
              style={{ background: i === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
