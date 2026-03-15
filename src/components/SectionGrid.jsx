import React from 'react';
import ArticleCard from './ArticleCard';

export default function SectionGrid({ sections }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div>
      {sections.map((section, sectionIndex) => (
        <div
          key={section.label}
          className={sectionIndex > 0 ? 'border-t border-white/10 pt-10 mt-10' : ''}
        >
          {/* Section header */}
          <div className="flex items-center mb-6">
            <span className="w-1 h-5 bg-tuwa-accent inline-block mr-3" />
            <span className="uppercase tracking-widest font-bold text-sm text-white">
              {section.label}
            </span>
          </div>

          {/* Article grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.articles.map((article, index) => (
              <ArticleCard key={article.slug} article={article} index={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
