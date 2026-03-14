import LegalContent from '../../components/LegalContent';
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '../../components/StructuredData';

export const metadata = {
  title: 'Legal | OpenTuwa',
  description: 'Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa.',
  openGraph: {
    title: 'Legal | OpenTuwa',
    description: 'Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa.',
    type: 'website',
    url: 'https://opentuwa.com/legal',
    images: [{ url: 'https://opentuwa.com/assets/ui/web_512.png', alt: 'OpenTuwa Legal' }],
    siteName: 'OpenTuwa',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal | OpenTuwa',
    description: 'Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa.',
    images: ['https://opentuwa.com/assets/ui/web_512.png'],
    site: '@opentuwa',
  },
  alternates: { canonical: 'https://opentuwa.com/legal' },
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema page="legal" />
      <LegalContent />
    </>
  );
}
