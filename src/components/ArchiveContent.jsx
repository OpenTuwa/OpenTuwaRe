'use client';

import React from 'react';
import Link from 'next/link';
import useScrollReveal from '../hooks/useScrollReveal';

function ArchiveYearSection({ yearGroup }) {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="reveal relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-tuwa-accent border-2 border-[#0a0a0b]" />

      <h2 className="text-3xl font-bold font-heading text-white mb-8 border-b border-white/5 pb-4">
        {yearGroup.year}
      </h2>
      <div className="space-y-6">
        {yearGroup.articles.map((article, index) => {
          const date = article.published_at 
            ? new Date(article.published_at) 
            : new Date();
          const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const tag = article.tags && typeof article.tags === 'string' 
            ? article.tags.split(',')[0].trim() 
            : 'Article';

          // SEO: Req 8.1, 8.3 — article titles rendered as crawlable <a> links
          return (
            <Link
              key={index}
              href={`/articles/${article.slug}`}
              className="group flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-8 hover:bg-white/[0.02] p-4 -mx-4 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-6 flex-1">
                <span className="text-sm text-tuwa-muted w-16 shrink-0 font-medium">{monthDay}</span>
                <h3 className="text-lg font-medium text-tuwa-text group-hover:text-tuwa-accent transition-colors leading-tight">
                  {article.title}
                </h3>
              </div>
              <div className="hidden sm:flex text-xs text-tuwa-muted shrink-0 uppercase tracking-widest font-bold">
                {tag}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function ArchiveContent({ archiveData = [] }) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight mb-4">
          Archive
        </h1>
        <p className="text-tuwa-muted text-lg">
          A complete timeline of all articles, documentaries, and stories published on OpenTuwa.
        </p>
      </div>

      <div className="space-y-16 border-l border-white/10 ml-3 md:ml-0 pl-6 md:pl-0">
        {archiveData.length === 0 ? (
           <p className="text-tuwa-muted">No articles found.</p>
        ) : (
           archiveData.map(group => (
             <ArchiveYearSection key={group.year} yearGroup={group} />
           ))
        )}
      </div>
    </main>
  );
}
