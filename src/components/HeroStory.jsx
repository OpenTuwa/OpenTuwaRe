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

  return (
    <div className="relative w-full h-[calc(100vh-119px)] min-h-[480px] max-h-[700px] overflow-hidden bg-tuwa-gray">
      {articles.map((article, i) => {
        const hasImage = Boolean(article.image_url);
        const primaryTag = article.tags?.split(',')[0]?.trim();

        return (
          <div
            key={article.slug}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
          >
            {/* Background image or fallback */}
            {hasImage ? (
              <SkeletonImage
                src={article.image_url}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-tuwa-gray" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Text + link — inside each slide so it fades with the image */}
            <Link
              href={`/articles/${article.slug}`}
              className="absolute inset-0 flex flex-col justify-end p-6 md:p-12"
              tabIndex={i === index ? 0 : -1}
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
                  <p className="text-white/70 text-base md:text-lg line-clamp-2 mb-4">
                    {article.subtitle}
                  </p>
                )}
                {(article.author_name || article.author || article.published_at) && (
                  <p className="text-white/60 text-sm">
                    {(article.author_name || article.author) && (
                      <span>{article.author_name || article.author}</span>
                    )}
                    {(article.author_name || article.author) && article.published_at && (
                      <span className="mx-2 opacity-50">·</span>
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
          </div>
        );
      })}

      {/* Progress indicators — read-only, no interaction */}
      {articles.length > 1 && (
        <div className="absolute bottom-5 right-6 flex gap-2 pointer-events-none z-10">
          {articles.map((_, i) => (
            <span
              key={i}
              className="block h-[2px] w-6 rounded-full transition-all duration-700"
              style={{ background: i === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
