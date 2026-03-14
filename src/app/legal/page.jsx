import LegalContent from '../../components/LegalContent';
import { LegalSEOHead } from '../../components/SEOHead';
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '../../components/StructuredData';

export const metadata = {
  title: 'Legal | OpenTuwa',
  description: 'Terms of Service, Privacy Policy, and Cookie Policy for OpenTuwa.',
};

export default function LegalPage() {
  return (
    <>
      <LegalSEOHead />
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema isArticle={false} />
      <LegalContent />
    </>
  );
}
