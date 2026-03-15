'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BreakingNewsTicker({ articles }) {
  const [paused, setPaused] = useState(false);

  if (!articles || articles.length === 0) return null;

  // Duplicate for seamless infinite loop
  const items = [...articles, ...articles];

  return (
    <div className="bg-tuwa-black border-b border-white/10 flex items-stretch overflow-hidden h-9">
      {/* LATEST badge */}
      <div className="flex-shrink-0 flex items-center bg-red-600 px-3 z-10">
        <span className="text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap">
          LATEST
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex items-center h-full animate-ticker-scroll whitespace-nowrap"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {items.map((article, i) => (
            <span key={`${article.slug}-${i}`} className="inline-flex items-center">
              <Link
                href={`/articles/${article.slug}`}
                className="text-tuwa-text text-sm hover:text-white transition-colors px-4"
              >
                {article.title}
              </Link>
              <span className="text-tuwa-muted text-xs select-none" aria-hidden="true">
                &bull;
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
