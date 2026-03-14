import { getRequestContext } from '@cloudflare/next-on-pages';
import ArchiveContent from '../../../components/ArchiveContent';
import { ArchiveSEOHead } from '../../../components/SEOHead';
import { OrganizationSchema, WebSiteSchema, CollectionPageSchema } from '../../../components/StructuredData';

export const runtime = 'edge';

export const metadata = {
  title: 'Archive | OpenTuwa',
  description: 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.',
};

async function getArchive() {
  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare("SELECT * FROM articles ORDER BY published_at DESC").all();
    
    if (!results || results.length === 0) return [];

    const grouped = results.reduce((acc, article) => {
      const date = article.published_at 
        ? new Date(article.published_at) 
        : new Date();
      const year = date.getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(article);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => b - a)
      .map(year => ({ year, articles: grouped[year] }));
  } catch (e) {
    console.error('Error fetching archive:', e);
    return [];
  }
}

export default async function ArchivePage() {
  const archiveData = await getArchive();
  return (
    <>
      <ArchiveSEOHead />
      <OrganizationSchema />
      <WebSiteSchema />
      <CollectionPageSchema />
      <ArchiveContent archiveData={archiveData} />
    </>
  );
}
