import { getRequestContext } from '@cloudflare/next-on-pages';
import AboutPageContent from '../../../components/AboutPageContent';
import GraphSchema from '../../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../../functions/_utils/hreflang.js';

export const runtime = 'edge';

export const metadata = {
  title: 'About OpenTuwa | Independent Journalism',
  description: 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.',
  openGraph: {
    title: 'About OpenTuwa | Independent Journalism',
    description: 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.',
    type: 'website',
    url: 'https://opentuwa.com/about',
    images: [{ url: 'https://opentuwa.com/assets/ui/web_512.png', width: 512, height: 512, alt: 'About OpenTuwa' }],
    siteName: 'OpenTuwa',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About OpenTuwa | Independent Journalism',
    description: 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.',
    images: ['https://opentuwa.com/assets/ui/web_512.png'],
    site: '@opentuwa',
  },
  alternates: {
    canonical: 'https://opentuwa.com/about',
    languages: buildHreflangLanguages('https://opentuwa.com/about'),
  },
  robots: { index: true, follow: true },
};

async function getAuthors() {
  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare("SELECT * FROM authors ORDER BY id ASC").all();
    
    return (results || []).map(a => {
      a.avatar = a.avatar_url;
      if (a.avatar && a.avatar.includes('jsdelivr')) {
        a.avatar = a.avatar.replace('https://cdn.jsdelivr.net/gh/OpenTuwa/OpenTuwaRe@main/', '/');
      }
      return a;
    });
  } catch (e) {
    console.error('Error fetching authors:', e);
    return [];
  }
}

export default async function AboutPage() {
  const authors = await getAuthors();
  return (
    <>
      <GraphSchema type="about" />
      <AboutPageContent authors={authors} />
    </>
  );
}
