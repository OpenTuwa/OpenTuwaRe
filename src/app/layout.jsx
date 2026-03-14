import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { OrganizationSchema, WebSiteSchema } from '../components/StructuredData';

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
    images: [{ url: '/assets/ui/web_512.png', width: 512, height: 512, alt: 'OpenTuwa' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@opentuwa',
    title: 'OpenTuwa | Independent Journalism & Documentaries',
    description: 'Independent news and journalism covering stories that matter.',
    images: ['/assets/ui/web_512.png'],
  },
  icons: {
    icon: [
      { url: '/assets/ui/web_512.png', sizes: '512x512', type: 'image/png' },
      { url: '/assets/ui/web.png', sizes: '128x128', type: 'image/png' },
      { url: '/assets/ui/web.ico', sizes: 'any' }
    ],
    apple: '/assets/ui/web.png'
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
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
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0b] text-tuwa-text">
        {children}
      </body>
      <GoogleAnalytics gaId="G-QLR0GR5SE8" />
    </html>
  );
}
