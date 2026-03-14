'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from './Footer';
import useScrollReveal from '../hooks/useScrollReveal';
import SkeletonImage from './SkeletonImage';
import VttEngine from './VttEngine';

function RevealSection({ children, className = '' }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

const ArticleContent = React.memo(({ html }) => {
  return <div dangerouslySetInnerHTML={{ __html: html || '<p>No content available.</p>' }} />;
});

export default function ArticleView({ article, recommended = [], authorInfo = {} }) {
  const router = useRouter();
  const slug = article.slug;
  
  const [readingProgress, setReadingProgress] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [inRecZone, setInRecZone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState({ loading: false, message: '', type: '' });

  const canAutoplayRef = useRef(false);
  const recommendedRef = useRef(recommended);
  const recommendedSectionRef = useRef(null);
  const inRecommendedZone = useRef(false);
  const sidebarHideTimer = useRef(null);

  useEffect(() => {
    recommendedRef.current = recommended;
  }, [recommended]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    testAudio.play()
      .then(() => { canAutoplayRef.current = true; })
      .catch(() => { canAutoplayRef.current = false; });
  }, []);

  useEffect(() => {
    let heartbeatInterval;
    let sessionId = sessionStorage.getItem('tuwa_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('tuwa_session_id', sessionId);
    }

    const harvestData = {
      session_id: sessionId,
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      referrer: document.referrer,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      window_width: window.innerWidth,
      window_height: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection_type: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      device_memory: navigator.deviceMemory || 0,
      hardware_concurrency: navigator.hardwareConcurrency || 0
    };

    fetch('/api/track-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', slug, ...harvestData })
    }).catch(() => {});

    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch('/api/track-interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping', slug, session_id: sessionId, duration: 10, scroll_depth: window.scrollY }) 
        }).catch(() => {});
      }
    }, 10000);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [slug]);

  useEffect(() => {
    let rafPending = false;

    const handleScroll = () => {
      if (rafPending) return;
      rafPending = true;

      requestAnimationFrame(() => {
        const threshold = article?.image_url ? (window.innerHeight * 0.8) - 80 : 50;
        setHeaderScrolled(window.scrollY > threshold);

        const total = Math.max(document.body.scrollHeight - window.innerHeight, 1);
        const pct = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
        setReadingProgress(pct);

        const recEl = recommendedSectionRef.current;
        if (recEl) {
          const rect = recEl.getBoundingClientRect();
          const isInZone = rect.top < window.innerHeight && rect.bottom > 0;
          inRecommendedZone.current = isInZone;
          setInRecZone(isInZone);
        }

        if (window.innerWidth >= 1024 && !inRecommendedZone.current) {
          setShowSidebar(true);
          if (sidebarHideTimer.current) clearTimeout(sidebarHideTimer.current);
          sidebarHideTimer.current = setTimeout(() => setShowSidebar(false), 2500);
        } else if (inRecommendedZone.current) {
          setShowSidebar(false);
        }

        rafPending = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  const articleRef = useRef(null); 

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubStatus({ loading: true, message: '', type: '' });
    try {
      const response = await fetch('/api/subscribe', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }) 
      });
      const data = await response.json();
      
      if (response.ok) {
        setSubStatus({ loading: false, message: data.message || 'Subscribed successfully!', type: 'success' });
        setEmail('');
        setTimeout(() => setSubStatus(prev => ({ ...prev, message: '' })), 4000);
      } else {
        setSubStatus({ loading: false, message: data.error || 'Subscription failed', type: 'error' });
      }
    } catch (err) {
      setSubStatus({ loading: false, message: 'System error. Please try again.', type: 'error' });
    }
  };

  const scrollToSubscribe = () => {
    document.getElementById('subscription-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently published';
  const authorName = article.author || 'Tuwa Media';
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const authorRole = authorInfo?.role || null;
  const authorAvatar = authorInfo?.avatar || authorInfo?.avatar_url || null;
  
  let tagsArray = [];
  if (Array.isArray(article.tags)) tagsArray = article.tags;
  else if (typeof article.tags === 'string') tagsArray = article.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="tuwa-upgrade selection-highlight bg-[rgba(10,10,11,1)] min-h-screen text-white">
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${headerScrolled ? 'backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-white/5 shadow-lg' : 'border-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-extrabold tracking-tighter font-heading text-white hover:text-white/80 transition-colors">OpenTuwa</Link>
            <div className={`hidden lg:flex items-center space-x-6 text-sm font-medium text-tuwa-muted transition-opacity duration-300 ${headerScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Link href="/" className="hover:text-white transition-colors">Stories</Link>
              <Link href="/archive" className="hover:text-white transition-colors">Archive</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={handleSearch} 
                placeholder="Search stories..." 
                className="bg-tuwa-black/60 text-sm text-white placeholder:text-tuwa-muted/60 rounded-full px-5 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-tuwa-accent transition-all" 
              />
            </div>
            <button onClick={scrollToSubscribe} className="text-xs font-semibold text-tuwa-muted hover:text-white cursor-pointer transition-colors uppercase tracking-wider">
              Subscribe
            </button>
          </div>
        </nav>
        <div className="fixed left-0 top-0 h-[3px] bg-gradient-to-r from-tuwa-accent to-tuwa-gold z-60 transition-all duration-150" style={{ width: `${readingProgress}%` }}></div>
      </header>

      <main>
        {article.image_url && (
          <section className="relative w-full h-[80vh] overflow-hidden">
            <SkeletonImage 
              alt={article.title} 
              className="w-full h-full object-cover transform scale-105" 
              src={article.image_url} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,11,1)] via-[rgba(10,10,11,0.6)] to-transparent"></div>
          </section>
        )}

        <section className={`relative z-10 px-6 ${article.image_url ? '-mt-40' : 'pt-40'}`}>
          <div className="max-w-4xl mx-auto text-center">
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {tagsArray.map((tag, idx) => (
                  <Link key={idx} href={`/?tag=${encodeURIComponent(tag)}`} className="px-3 py-1 border border-white/10 rounded-full text-[10px] tracking-widest font-bold uppercase hover:bg-white/10 transition-colors text-white">
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-white leading-tight">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-xl md:text-2xl text-tuwa-muted font-light max-w-2xl mx-auto leading-relaxed">
                {article.subtitle}
              </p>
            )}
            <div className="mt-12 flex items-center justify-center space-x-6 border-y border-white/5 py-8 flex-wrap gap-y-4">
              <Link href={`/?author=${encodeURIComponent(authorName)}`} className="flex items-center space-x-3 group">
                {authorAvatar ? (
                  <SkeletonImage src={authorAvatar} alt={authorName} className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-tuwa-accent transition-colors" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-tuwa-accent flex items-center justify-center font-bold text-sm text-white uppercase group-hover:bg-blue-600 transition-colors">
                    {authorInitials}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-tuwa-accent transition-colors flex items-center gap-1.5">
                    {authorName}
                    {(authorRole === 'Founder and Editor-in-Chief' || authorRole === 'Developer') && (
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1D9BF0"/><path d="M9.5 12.5L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </p>
                  <p className="text-xs text-tuwa-muted">{authorRole || 'Author'}</p>
                </div>
              </Link>
              <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{publishedDate}</p>
                <p className="text-xs text-tuwa-muted">{article.read_time_minutes || 5} min read</p>
              </div>
            </div>
          </div>
        </section>

        {/* key={slug} ensures a fresh DOM unmount/mount on every client navigation */}
        <article key={slug} ref={articleRef} className="max-w-[720px] mx-auto px-6 py-20 prose prose-invert prose-xl text-tuwa-text prose-a:text-tuwa-accent hover:prose-a:text-blue-400 prose-img:rounded-xl">
          <ArticleContent html={article.content_html} />
        </article>

        <VttEngine key={slug} articleRef={articleRef} slug={slug} htmlContent={article?.content_html} />

        {!inRecZone && (
          <aside className={`fixed right-4 top-28 w-64 hidden xl:block transition-all duration-500 z-40 ${showSidebar ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
            <div className="bg-[rgba(10,10,11,0.75)] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <div className="mb-4 px-1">
                <span className="text-[10px] tracking-widest font-bold uppercase text-tuwa-muted/70">Trending Now</span>
              </div>
              <div className="space-y-1">
                {recommended.slice(0, 5).map((a) => (
                  <Link
                    key={a.slug}
                    href={`/articles/${a.slug}`}
                    className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.08] transition-all duration-200"
                  >
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <SkeletonImage
                        src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-white/70 group-hover:text-white leading-snug line-clamp-2 transition-colors duration-200">{a.title}</div>
                      <div className="text-[10px] text-tuwa-muted/50 mt-1 group-hover:text-tuwa-muted/80 transition-colors duration-200">{a.read_time_minutes || 5} min</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}

        <RevealSection>
          <section ref={recommendedSectionRef} className="max-w-6xl mx-auto px-6 pb-24">
            <h3 className="text-2xl font-bold text-white mb-8">Recommended For You</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommended.length === 0 ? (
                <div className="text-tuwa-muted col-span-full py-10 text-center bg-white/5 rounded-xl border border-white/5">
                  No recommendations available at this time.
                </div>
              ) : (
                recommended.slice(0, 8).map(a => (
                  <Link key={a.slug} href={`/articles/${a.slug}`} className="group block rounded-xl overflow-hidden bg-tuwa-black border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300 shadow-lg hover:shadow-2xl">
                    <div className="w-full h-40 overflow-hidden bg-white/5">
                      <SkeletonImage 
                        src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'} 
                        alt={a.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-tuwa-accent transition-colors">{a.title}</h4>
                      <div className="text-[11px] text-tuwa-muted/70 flex items-center gap-1">
                        {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Recently'} &middot; {a.read_time_minutes || 5} min
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </RevealSection>
      </main>

      <section id="subscription-cta" className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-tuwa-gray to-black border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-tuwa-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-tuwa-gold/10 rounded-full blur-3xl"></div>
          
          <h3 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-white relative z-10">Stay Intellectual. Stay Informed.</h3>
          <p className="text-tuwa-muted mb-8 max-w-xl mx-auto relative z-10">
            Join thousands of readers who receive our weekly deep dives and documentary releases. No spam, just substance.
          </p>
          
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative z-10 flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com" 
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white placeholder:text-tuwa-muted/50 focus:outline-none focus:ring-1 focus:ring-tuwa-accent focus:bg-white/10 transition-all"
            />
            <button 
              type="submit" 
              disabled={subStatus.loading}
              className="bg-tuwa-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              {subStatus.loading ? 'Joining...' : 'Subscribe'}
            </button>
          </form>
          {subStatus.message && (
            <div className={`mt-4 text-sm ${subStatus.type === 'error' ? 'text-red-400' : 'text-green-400'} animate-fade-in`}>
              {subStatus.message}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}