import GraphSchema from '../../../components/GraphSchema';

export const runtime = 'edge';

export const metadata = {
  title: 'Legal | OpenTuwa',
  description: 'Ethics policy, corrections policy, and legal information for OpenTuwa.',
  alternates: { canonical: 'https://opentuwa.com/legal' },
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return (
    <>
      <GraphSchema type="legal" />
      <main className="max-w-3xl mx-auto px-6 py-24 text-white">
        <h1 className="text-4xl font-extrabold mb-12 tracking-tight">Legal</h1>

        <section id="ethics" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Ethics Policy</h2>
          <p className="text-tuwa-muted leading-relaxed">
            OpenTuwa is committed to independent, accurate, and fair journalism. Our editorial decisions
            are made free from commercial or political influence. We disclose conflicts of interest,
            correct errors promptly, and treat all subjects with dignity and fairness.
          </p>
        </section>

        <section id="corrections" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Corrections Policy</h2>
          <p className="text-tuwa-muted leading-relaxed">
            When we make factual errors, we correct them transparently and as quickly as possible.
            Corrections are noted inline on the affected article. To report an error, contact us at{' '}
            <a href="mailto:founder@opentuwa.com" className="text-tuwa-accent hover:underline">
              founder@opentuwa.com
            </a>.
          </p>
        </section>

        <section id="privacy" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Privacy</h2>
          <p className="text-tuwa-muted leading-relaxed">
            We collect minimal data necessary to operate the site. We do not sell personal information
            to third parties. By using OpenTuwa, you agree to our data practices as described here.
          </p>
        </section>

        <section id="copyright" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Copyright</h2>
          <p className="text-tuwa-muted leading-relaxed">
            All content on OpenTuwa is &copy; {new Date().getFullYear()} OpenTuwa Media unless otherwise
            stated. Reproduction without permission is prohibited. For licensing inquiries, contact{' '}
            <a href="mailto:founder@opentuwa.com" className="text-tuwa-accent hover:underline">
              founder@opentuwa.com
            </a>.
          </p>
        </section>
      </main>
    </>
  );
}
