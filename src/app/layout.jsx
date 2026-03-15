import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import GraphSchema from '../components/GraphSchema';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'OpenTuwa | Independent Journalism & Documentaries',
    template: '%s | OpenTuwa'
  },
  description: 'OpenTuwa — independent news and journalism covering stories that matter.',
  metadataBase: new URL('https://opentuwa.com'),
  openGraph: {
    siteName: 'OpenTuwa',
    locale: 'en_US',
    type: 'website',
    title: 'OpenTuwa | Independent Journalism & Documentaries',
    description: 'Independent news and journalism covering stories that matter.',
    images: [
      { url: '/assets/ui/web_1200.png', width: 1200, height: 630, alt: 'OpenTuwa - Independent Journalism' }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@opentuwa',
    title: 'OpenTuwa | Independent Journalism & Documentaries',
    description: 'Independent news and journalism covering stories that matter.',
    images: ['/assets/ui/web_1200.png'],
  },
  icons: {
    icon: [
      { url: '/assets/ui/web_512.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/ui/web_512.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/ui/web.png', sizes: '128x128', type: 'image/png' },
      { url: '/assets/ui/web.ico', sizes: 'any' }
    ],
    apple: '/assets/ui/web_512.png'
  },
  alternates: {
    // SEO: Req 12.1, 12.2 — RSS feed auto-discovery link
    // Next.js emits <link rel="alternate" type="application/rss+xml" href="/feed.xml"> in <head>
    types: {
      'application/rss+xml': '/feed.xml'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Additional SEO metadata
  keywords: 'news, journalism, documentaries, independent media, deep dive, analysis, OpenTuwa',
  authors: [{ name: 'OpenTuwa' }],
  creator: 'OpenTuwa',
  publisher: 'OpenTuwa',
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        {/* Preconnect for Google Fonts and Analytics — reduces render-blocking latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Preload critical assets */}
        <link rel="preload" href="/assets/ui/web_512.png" as="image" />
        <link rel="preload" href="/assets/ui/web_1200.png" as="image" />
        {/* Preload fonts for better performance */}
        <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin />
        <link rel="preload" href="/fonts/plus-jakarta-sans-var-latin.woff2" as="font" type="font/woff2" crossOrigin />
        {/* Structured Data */}
        <GraphSchema type="homepage" />
        {/* Additional SEO meta tags */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#0a0a0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/assets/ui/web.svg" color="#0a0a0b" />
        {/* Silktide Consent Manager CSS */}
        <link rel="stylesheet" href="/legal/cookieconsent.css" />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0b] text-tuwa-text">
        {children}
      </body>
      {/* GCM v2 defaults — must fire before GTM so all consent signals start as denied */}
      <Script id="gcm-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      `}</Script>
      <GoogleAnalytics gaId="G-QLR0GR5SE8" />
      {/* Silktide Consent Manager — self-hosted, init runs via onLoad to guarantee library is ready */}
      <Script
        src="/legal/cookieconsent.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.silktideConsentManager.init({
            consentTypes: [
              {
                id: 'necessary',
                required: true,
                label: 'Necessary',
                description: '<p>These cookies are essential for the website to function correctly and cannot be disabled.</p>',
              },
              {
                id: 'analytics',
                required: false,
                label: 'Analytics',
                description: '<p>These cookies help us understand how visitors interact with the site so we can improve it.</p>',
                gtag: 'analytics_storage',
                onAccept: function() {
                  if (typeof gtag === 'function') {
                    gtag('consent', 'update', { analytics_storage: 'granted' });
                    window.dataLayer.push({ event: 'consent_accepted_analytics' });
                  }
                },
                onReject: function() {
                  if (typeof gtag === 'function') {
                    gtag('consent', 'update', { analytics_storage: 'denied' });
                  }
                },
              },
              {
                id: 'marketing',
                required: false,
                label: 'Marketing',
                description: '<p>These cookies are used to deliver personalised advertising and track ad performance.</p>',
                gtag: ['ad_storage', 'ad_user_data', 'ad_personalization'],
                onAccept: function() {
                  if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                      ad_storage: 'granted',
                      ad_user_data: 'granted',
                      ad_personalization: 'granted',
                    });
                    window.dataLayer.push({ event: 'consent_accepted_marketing' });
                  }
                },
                onReject: function() {
                  if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                      ad_storage: 'denied',
                      ad_user_data: 'denied',
                      ad_personalization: 'denied',
                    });
                  }
                },
              },
            ],
            prompt: { position: 'bottomCenter' },
            icon: { position: 'bottomLeft' },
            text: {
              prompt: {
                description: '<p>We use cookies to enhance your experience and analyse traffic. <a href="/legal#cook-1" target="_blank">Cookie Policy.</a></p>',
                acceptAllButtonText: 'Accept all',
                rejectNonEssentialButtonText: 'Reject non-essential',
                preferencesButtonText: 'Preferences',
              },
              preferences: {
                title: 'Customise your cookie preferences',
                description: '<p>You can choose which types of cookies to allow. Your preferences apply across this website.</p>',
              },
            },
          });
        }}
      />
    </html>
  );
}
