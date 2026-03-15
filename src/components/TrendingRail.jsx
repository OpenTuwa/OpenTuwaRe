import Link from 'next/link';

export default function TrendingRail({ articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="bg-tuwa-gray p-6">
      <p className="text-xs uppercase tracking-widest font-bold text-tuwa-muted mb-4">
        Trending
      </p>
      <ol className="space-y-1">
        {articles.slice(0, 5).map((article, index) => {
          const rank = String(index + 1).padStart(2, '0');
          const date = article.published_at
            ? new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : null;

          return (
            <li key={article.slug}>
              <Link
                href={`/articles/${article.slug}`}
                className="flex items-start gap-4 px-2 py-3 hover:bg-white/5 transition-colors rounded"
              >
                <span className="text-tuwa-gold font-bold text-2xl leading-none w-8 shrink-0">
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-tuwa-text text-sm leading-snug line-clamp-2">
                    {article.title}
                  </p>
                  {date && (
                    <p className="text-tuwa-muted text-xs mt-1">{date}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
