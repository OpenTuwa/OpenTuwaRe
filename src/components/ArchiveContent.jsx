'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ArchiveContent({ archiveData = [] }) {
  const [filterYear, setFilterYear] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  // Derive filter options from archiveData
  const years = archiveData.map(g => g.year);
  const categories = [...new Set(
    archiveData.flatMap(g =>
      g.articles.map(a => (a.section || a.category || '').trim()).filter(Boolean)
    )
  )];

  // Total article count
  const totalCount = archiveData.reduce((sum, g) => sum + g.articles.length, 0);

  // Filter logic (client-side, no server fetch)
  const filteredData = archiveData
    .filter(g => !filterYear || String(g.year) === String(filterYear))
    .map(g => ({
      ...g,
      articles: filterCategory
        ? g.articles.filter(a => (a.section || a.category) === filterCategory)
        : g.articles,
    }))
    .filter(g => g.articles.length > 0);

  return (
    <main className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      {/* Page header */}
      <div className="border-b border-white/10 pb-8 mb-8">
        <p className="text-xs uppercase tracking-widest text-tuwa-muted mb-2">OpenTuwa</p>
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight mb-2">Archive</h1>
        <p className="text-tuwa-muted">{totalCount} stories</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={filterYear || ''}
          onChange={e => setFilterYear(e.target.value || null)}
          className="bg-tuwa-gray border border-white/10 text-tuwa-text text-sm rounded px-3 py-2 focus:outline-none focus:border-tuwa-accent"
        >
          <option value="">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterCategory || ''}
          onChange={e => setFilterCategory(e.target.value || null)}
          className="bg-tuwa-gray border border-white/10 text-tuwa-text text-sm rounded px-3 py-2 focus:outline-none focus:border-tuwa-accent"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Article index */}
      {filteredData.length === 0 ? (
        <p className="text-tuwa-muted py-12 text-center">No stories found.</p>
      ) : (
        filteredData.map(group => (
          <section key={group.year} className="mb-12">
            <h2 className="text-2xl font-bold font-heading text-white mb-4 pb-2 border-b border-white/10">
              {group.year}
            </h2>
            <div>
              {group.articles.map((article, index) => {
                const monthDay = article.published_at
                  ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '';
                const tag = article.section || article.category || article.tags?.split(',')[0]?.trim() || '';

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 py-3 border-b border-white/5 hover:bg-white/[0.02] px-2 -mx-2 rounded transition-colors"
                  >
                    <span className="text-xs text-tuwa-muted w-16 shrink-0">{monthDay}</span>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="flex-1 text-tuwa-text hover:text-tuwa-accent transition-colors text-sm font-medium leading-snug"
                    >
                      {article.title}
                    </Link>
                    <span className="hidden sm:block text-xs text-tuwa-muted shrink-0">
                      {article.author || article.author_name || ''}
                    </span>
                    <span className="hidden sm:block text-xs text-tuwa-muted uppercase tracking-wider shrink-0 w-24 text-right">
                      {tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
