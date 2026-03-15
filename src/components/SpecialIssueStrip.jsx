import Link from 'next/link';
import SkeletonImage from './SkeletonImage';

/**
 * Visually distinct block for Special Issue / Event coverage.
 * Dark background, accent left border, horizontal card row.
 */
export default function SpecialIssueStrip({ label, articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="border-l-4 border-tuwa-accent bg-white/[0.03] rounded-r px-6 py-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-tuwa-accent text-[10px] font-bold uppercase tracking-[0.2em]">
          Special Coverage
        </span>
        <span className="text-white/20 text-xs">·</span>
        <span className="text-white text-sm font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Horizontal card row — scrollable on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {articles.map((article) => {
          const date = article.published_at
            ? new Date(article.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })
            : null;

          return (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="flex-shrink-0 w-56 group"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-32 overflow-hidden rounded bg-tuwa-gray mb-3">
                {article.image_url ? (
                  <SkeletonImage
                    src={article.image_url}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-tuwa-gray" />
                )}
              </div>

              {/* Text */}
              <p className="text-white text-sm font-semibold leading-snug line-clamp-3 group-hover:text-tuwa-accent transition-colors">
                {article.title}
              </p>
              {date && (
                <p className="text-white/40 text-xs mt-1">{date}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
