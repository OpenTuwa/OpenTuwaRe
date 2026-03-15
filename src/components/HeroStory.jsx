import Link from 'next/link';
import SkeletonImage from './SkeletonImage';

export default function HeroStory({ article }) {
  if (!article) return null;

  const primaryTag = article.tags?.split(',')[0]?.trim();
  const hasImage = Boolean(article.image_url);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group relative block w-full h-[320px] md:h-[560px] overflow-hidden bg-tuwa-gray"
    >
      {/* Image or fallback */}
      {hasImage ? (
        <SkeletonImage
          src={article.image_url}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-tuwa-gray" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Text content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-3xl">
        {primaryTag && (
          <span className="inline-block mb-3 px-2 py-0.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded">
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
              <span className="mx-2">·</span>
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
  );
}
