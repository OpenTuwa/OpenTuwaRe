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
    <div className="relative w-full overflow-hidden bg-[#0a0a0b]" style={{ height: 'calc(100vh - 80px)', minHeight: 480, maxHeight: 640 }}>
      {articles.map((article, i) => {
        const hasImage = Boolean(article.image_url);
        const section = article.section || article.category || null;
        const author = article.author_name || article.author || null;
        const date = article.published_at
          ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : null;

        return (
          <div
            key={article.slug}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
          >
            <Link href={`/articles/${article.slug}`} className="flex h-full" tabIndex={i === index ? 0 : -1}>
              {/* Left: text panel */}
              <div className="relative z-10 flex flex-col justify-end w-full md:w-[45%] bg-[#0a0a0b] px-8 md:px-12 py-10 shrink-0">
                {section && (
                  <span className="text-tuwa-accent text-xs font-bold uppercase tracking-widest mb-3">
                    {section}
                  </span>
                )}
                <h1 className="text-white text-2xl md:text-3xl font-bold leading-snug mb-3 line-clamp-4">
                  {article.title}
                </h1>
                {article.subtitle && (
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-4">
                    {article.subtitle}
                  </p>
                )}
                <p className="text-white/40 text-xs">
                  {author && <span>{author}</span>}
                  {author && date && <span className="mx-2">·</span>}
                  {date && <span>{date}</span>}
                </p>

                {/* Slide indicators */}
                {articles.length > 1 && (
                  <div className="flex gap-1.5 mt-6 pointer-events-none">
                    {articles.map((_, j) => (
                      <span
                        key={j}
                        className="block h-[2px] rounded-full transition-all duration-500"
                        style={{
                          width: j === index ? 24 : 12,
                          background: j === index ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: image */}
              <div className="hidden md:block flex-1 relative overflow-hidden">
                {hasImage ? (
                  <SkeletonImage
                    src={article.image_url}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-tuwa-gray" />
                )}
                {/* subtle left-edge fade to blend with text panel */}
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0b] to-transparent" />
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
