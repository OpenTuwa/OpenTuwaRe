import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

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
    default: 'OpenTuwa',
    template: '%s | OpenTuwa'
  },
  description: 'OpenTuwa — independent news and journalism covering stories that matter.',
  openGraph: {
    siteName: 'OpenTuwa',
    locale: 'en_US',
    type: 'website',
    title: 'OpenTuwa',
    description: 'Independent news and journalism covering stories that matter.',
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
  }
};

export const viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="font-sans antialiased bg-[#0a0a0b] text-tuwa-text">
        {children}
      </body>
    </html>
  );
}
