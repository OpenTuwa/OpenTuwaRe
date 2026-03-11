import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import useScrollReveal from '../hooks/useScrollReveal';
import SkeletonImage from '../components/SkeletonImage';

function RevealSection({ children, className = '' }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function ArticleLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [readingProgress, setReadingProgress] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [inRecZone, setInRecZone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [authorRole, setAuthorRole] = useState(null);
  const [authorAvatar, setAuthorAvatar] = useState(null);

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState({ loading: false, message: '', type: '' });

  const canAutoplayRef = useRef(false);
  const recommendedRef = useRef([]);
  const recommendedSectionRef = useRef(null);
  const inRecommendedZone = useRef(false);

  useEffect(() => {
    recommendedRef.current = recommended;
  }, [recommended]);

  useEffect(() => {
    // Scan browser Media Engagement Index (MEI)
    // Attempts to play a 1-second silent audio string to verify if soundful autoplay is permitted
    const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    testAudio.play().then(() => {
        canAutoplayRef.current = true;
    }).catch(() => {
        canAutoplayRef.current = false; // MEI is too low; auto-advance with sound is blocked
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/article/${slug}`);
        if (!res.ok) throw new Error('Article could not be found.');
        const articleData = await res.json();
        setArticle(articleData);

        let sessionId = sessionStorage.getItem('tuwa_session_id');
        if (!sessionId) {
          sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
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

        // Fire and forget - Server will handle Neural Embedding
        fetch('/api/track-interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view', slug, ...harvestData })
        }).catch(()=>{});

        const heartbeat = setInterval(() => {
          if (document.visibilityState === 'visible') {
            fetch('/api/track-interaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'ping', slug, session_id: sessionId, duration: 10, scroll_depth: window.scrollY }) 
            }).catch(() => {});
          }
        }, 10000);

        // Fetch Neural Recommendations
        const isVideoArticle = articleData.content_html && (articleData.content_html.includes('<video') || articleData.content_html.includes('iframe'));
        const recRes = await fetch(`/api/recommendations?slug=${slug}&session_id=${sessionId}${isVideoArticle ? '&video_only=true' : ''}`);
        
        if (recRes.ok) {
          const recommendations = await recRes.json();
          setRecommended(recommendations);
        }

        return () => clearInterval(heartbeat);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!article?.author) return;
    const fetchAuthorRole = async () => {
      try {
        const res = await fetch(`/api/authors_1?name=${encodeURIComponent(article.author)}`);
        if (res.ok) {
          const data = await res.json();
          setAuthorRole(data.role || null);
          setAuthorAvatar(data.avatar || data.avatar_url || null);
        }
      } catch (e) {}
    };
    fetchAuthorRole();
  }, [article]);



  useEffect(() => {
    let hideTimer = null;
    let rafPending = false;

    const handleScroll = () => {
      const threshold = article?.image_url ? (window.innerHeight * 0.8) - 80 : 50;
      setHeaderScrolled(window.scrollY > threshold);

      const total = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const pct = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
      setReadingProgress(pct);

      // Check if recommended section is in view using direct DOM measurement
      const recEl = recommendedSectionRef.current;
      if (recEl) {
        const rect = recEl.getBoundingClientRect();
        const isInZone = rect.top < window.innerHeight && rect.bottom > 0;
        inRecommendedZone.current = isInZone;
        setInRecZone(isInZone);
      }

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          if (window.innerWidth >= 1024 && !inRecommendedZone.current) {
            setShowSidebar(true);
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setShowSidebar(false), 2000);
          } else if (inRecommendedZone.current) {
            setShowSidebar(false);
          }
          rafPending = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  useEffect(() => {
    if (!article || !article.content_html) return;

    // Collect cleanup functions so we can tear down on unmount / article change
    const cleanupFns = [];
    let initTimer = null;

    const initHybridSubtitles = async () => {
      const subtitleBoxes = document.querySelectorAll('.tuwa-subtitle-box');
      if (subtitleBoxes.length === 0) return;

      let needsYouTubeAPI = false;
      const ytPlayersQueue = [];

      const handleVideoEnd = () => {
        if (canAutoplayRef.current && recommendedRef.current.length > 0) {
          navigate(`/articles/${recommendedRef.current[0].slug}`);
        }
      };

      // ─── VTT time parser ───────────────────────────────────────────────────
      // Strips trailing cue-setting tokens (align:start position:0% etc.)
      // before splitting on ':' so position metadata never corrupts the result.
      const parseVttTime = (timeStr) => {
        const clean = timeStr.trim().split(/\s+/)[0].replace(',', '.');
        const parts = clean.split(':');
        return parts.length === 3
          ? parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
          : parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      };

      for (const box of subtitleBoxes) {
        const mediaId = box.dataset.video || box.dataset.youtube;
        const vttUrl  = box.dataset.vtt;
        const mediaEl = document.getElementById(mediaId);

        console.log('[SubEngine] subtitle box found', { mediaId, vttUrl, mediaElFound: !!mediaEl });

        if (!mediaId) { console.warn('[SubEngine] Skipping: missing data-video / data-youtube'); continue; }
        if (!vttUrl)  { console.warn('[SubEngine] Skipping: missing data-vtt');                   continue; }
        if (!mediaEl) { console.warn(`[SubEngine] Skipping: no DOM element with id="${mediaId}"`); continue; }

        try {
          const response = await fetch(vttUrl);
          if (!response.ok) throw new Error(`VTT fetch failed — HTTP ${response.status} for ${vttUrl}`);
          const vttText = await response.text();

          // ─── Parse cues ─────────────────────────────────────────────────────
          const cues = [];
          const lines = vttText.replace(/\r\n/g, '\n').split('\n');
          let currentCue = null;

          for (let line of lines) {
            line = line.trim();

            // Skip header / metadata lines
            if (!line
              || line.startsWith('WEBVTT')
              || line.startsWith('Kind:')
              || line.startsWith('Language:')
              || line.startsWith('NOTE')) continue;

            if (line.includes('-->')) {
              // Flush previous cue if it has text
              if (currentCue && currentCue.textLines.length > 0) {
                cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
              }
              const times = line.split('-->');
              currentCue = { start: parseVttTime(times[0]), end: parseVttTime(times[1]), textLines: [] };
            } else if (currentCue) {
              // Cue text line
              currentCue.textLines.push(line);
            }
            // Lines with no currentCue (cue identifiers like "1", "2") are
            // safely ignored by the else branch above.
          }
          // Flush the last cue
          if (currentCue && currentCue.textLines.length > 0) {
            cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
          }

          console.log(`[SubEngine] Parsed ${cues.length} cues from ${vttUrl}`);

          const updateSubtitle = (currentTime) => {
            const activeCue = cues.find(c => currentTime >= c.start && currentTime <= c.end);
            box.innerHTML = activeCue ? `<span class="active-text">${activeCue.text}</span>` : '';
          };

          // ─── Native <video> ──────────────────────────────────────────────────
          if (mediaEl.tagName.toLowerCase() === 'video') {
            updateSubtitle(mediaEl.currentTime || 0);

            const onTimeUpdate = () => updateSubtitle(mediaEl.currentTime);
            const onSeeked    = () => updateSubtitle(mediaEl.currentTime);

            mediaEl.addEventListener('timeupdate', onTimeUpdate);
            mediaEl.addEventListener('seeked',     onSeeked);
            mediaEl.addEventListener('ended',      handleVideoEnd);

            cleanupFns.push(() => {
              mediaEl.removeEventListener('timeupdate', onTimeUpdate);
              mediaEl.removeEventListener('seeked',     onSeeked);
              mediaEl.removeEventListener('ended',      handleVideoEnd);
            });

          // ─── YouTube <iframe> ────────────────────────────────────────────────
          } else if (mediaEl.tagName.toLowerCase() === 'iframe') {
            needsYouTubeAPI = true;
            ytPlayersQueue.push({ id: mediaId, render: updateSubtitle, onEnd: handleVideoEnd });
          }

        } catch (error) {
          // Log clearly but don't hide the box — leave it empty rather than gone
          console.error('[SubEngine] Error initialising subtitles:', error);
        }
      }

      // ─── YouTube IFrame API loader ─────────────────────────────────────────
      if (needsYouTubeAPI) {
        const initializeYTPlayers = () => {
          ytPlayersQueue.forEach(p => {
            new window.YT.Player(p.id, {
              events: {
                onReady: (event) => {
                  const interval = setInterval(() => {
                    try {
                      if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
                        p.render(event.target.getCurrentTime());
                      }
                    } catch (e) {
                      // Player was destroyed (e.g. navigation); stop polling
                      clearInterval(interval);
                    }
                  }, 100);
                  // Register interval for cleanup on unmount
                  cleanupFns.push(() => clearInterval(interval));
                },
                onStateChange: (event) => {
                  if (event.data === window.YT.PlayerState.ENDED && p.onEnd) {
                    p.onEnd();
                  }
                }
              }
            });
          });
        };

        if (window.YT && window.YT.Player) {
          // API already loaded — initialise immediately
          initializeYTPlayers();
        } else {
          // Chain onto any previously registered callback (don't overwrite it)
          const prevCallback = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            if (typeof prevCallback === 'function') prevCallback();
            initializeYTPlayers();
          };

          // Only inject the script tag once
          if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.getElementsByTagName('script')[0].parentNode.insertBefore(
              tag, document.getElementsByTagName('script')[0]
            );
          }
        }
      }
    };

    // Give dangerouslySetInnerHTML time to commit to the DOM, then init
    initTimer = setTimeout(initHybridSubtitles, 800);

    return () => {
      clearTimeout(initTimer);
      cleanupFns.forEach(fn => fn());
    };
  }, [article]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubStatus({ loading: true, message: '', type: '' });
    try {
      const response = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (response.ok) {
        setSubStatus({ loading: false, message: data.message || 'Subscribed successfully', type: 'success' });
        setEmail('');
        setTimeout(() => setSubStatus(prev => ({ ...prev, message: '' })), 4000);
      } else {
        setSubStatus({ loading: false, message: data.error || 'Failed', type: 'error' });
      }
    } catch (err) {
      setSubStatus({ loading: false, message: 'System error', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="tuwa-upgrade bg-[rgba(10,10,11,1)] min-h-screen text-white flex items-center justify-center">
        <h2 className="text-2xl font-bold animate-pulse text-tuwa-muted">Loading article...</h2>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="tuwa-upgrade bg-[rgba(10,10,11,1)] min-h-screen text-white py-40 text-center">
         <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Oops!</h2>
            <p className="text-tuwa-text mb-6">{error || 'Article not found.'}</p>
            <button onClick={() => navigate('/')} className="text-tuwa-accent hover:underline font-medium">← Back to Home</button>
        </div>
      </div>
    );
  }

  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently published';
  const authorName = article.author || 'Tuwa Media';
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const tagsArray = article.tags ? article.tags.split(',').map(t => t.trim()) : [];
  
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://opentuwa.com';
  const articleUrl = `${siteUrl}/articles/${slug}`;
  const seoTitle = `${article.title} | OpenTuwa`;
  const seoDesc = article.seo_description || article.subtitle || article.excerpt || '';
  const ldHeadline = article.title.length > 110 ? article.title.substring(0, 107) + '...' : article.title;
  const isoPublished = article.published_at ? new Date(article.published_at).toISOString() : '';
  const isoModified = article.updated_at ? new Date(article.updated_at).toISOString() : isoPublished;
  const section = article.section || article.category || 'News';
  
  const hasVideo = article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe'));
  let videoSchema = undefined;
  if (hasVideo) {
     videoSchema = {
       '@type': 'VideoObject', 'name': article.title, 'description': seoDesc,
       'thumbnailUrl': article.image_url ? [article.image_url] : [`${siteUrl}/img/logo.png`],
       'uploadDate': isoPublished, 'contentUrl': articleUrl, 'embedUrl': articleUrl
     };
  }

  const newsArticleLd = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    'mainEntityOfPage': { '@type': 'WebPage', '@id': articleUrl },
    'headline': ldHeadline, 'alternativeHeadline': article.subtitle || undefined,
    'description': seoDesc, 'image': article.image_url ? [article.image_url] : undefined,
    'author': { '@type': 'Person', 'name': authorName },
    'publisher': {
      '@type': 'Organization', 'name': 'OpenTuwa', 'url': siteUrl,
      'logo': { '@type': 'ImageObject', 'url': `${siteUrl}/img/logo.png`, 'width': 600, 'height': 60 },
      'sameAs': ['https://twitter.com/OpenTuwa', 'https://www.facebook.com/OpenTuwa', 'https://www.instagram.com/OpenTuwa']
    },
    'datePublished': isoPublished || undefined, 'dateModified': isoModified || undefined,
    'articleSection': section, 'isAccessibleForFree': true, 'inLanguage': 'en', 'genre': section,
    'copyrightHolder': { '@type': 'Organization', 'name': 'OpenTuwa' },
    'copyrightYear': new Date(article.published_at || Date.now()).getFullYear()
  };
  if (videoSchema) newsArticleLd.video = videoSchema;

  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
      { '@type': 'ListItem', 'position': 2, 'name': 'Articles', 'item': `${siteUrl}/archive` },
      { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': articleUrl }
    ]
  };

  return (
    <div className="tuwa-upgrade selection-highlight bg-[rgba(10,10,11,1)] min-h-screen text-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        {tagsArray.length > 0 && <meta name="keywords" content={tagsArray.join(', ')} />}
        <meta name="author" content={authorName} />
        <meta property="og:site_name" content="OpenTuwa" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={seoDesc} />
        {article.image_url && <meta property="og:image" content={article.image_url} />}
        {isoPublished && <meta property="article:published_time" content={isoPublished} />}
        <meta name="twitter:card" content={article.image_url ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={seoDesc} />
        {article.image_url && <meta name="twitter:image" content={article.image_url} />}
        <link rel="canonical" href={articleUrl} />
        <script type="application/ld+json">{JSON.stringify(newsArticleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <header className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${headerScrolled ? 'backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-white/5' : 'border-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a className="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">OpenTuwa</a>
            <div className={`hidden lg:flex items-center space-x-6 text-sm font-medium text-tuwa-muted transition-opacity ${headerScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <a className="hover:text-white transition-colors" href="/">Stories</a>
              <a className="hover:text-white transition-colors" href="/archive">Archive</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} placeholder="Search stories" className="bg-tuwa-black/60 text-sm text-white placeholder:text-tuwa-muted/60 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-tuwa-accent" />
            </div>
            <a className="text-xs text-tuwa-muted hover:text-white cursor-pointer" onClick={() => document.getElementById('subscription-cta').scrollIntoView({ behavior: 'smooth' })}>Subscribe</a>
          </div>
        </nav>
        <div className="fixed left-0 top-0 h-[3px] bg-gradient-to-r from-tuwa-accent to-tuwa-gold z-60 transition-all duration-150" style={{ width: `${readingProgress}%` }}></div>
      </header>

      <main>
        {article.image_url && (
          <section className="relative w-full h-[80vh] overflow-hidden">
            <SkeletonImage alt={article.title} className="w-full h-full object-cover transform scale-105" src={article.image_url}/>
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,11,1)] via-[rgba(10,10,11,0.6)] to-transparent"></div>
          </section>
        )}

        <section className={`relative z-10 px-6 ${article.image_url ? '-mt-40' : 'pt-40'}`}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {tagsArray.map((tag, idx) => (
                <button key={idx} onClick={() => navigate(`/?tag=${encodeURIComponent(tag)}`)} className="px-3 py-1 border border-white/10 rounded-full text-[10px] tracking-widest font-bold uppercase hover:bg-white/10 transition-colors text-white">{tag}</button>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight !text-white"><span className="!text-white">{article.title}</span></h1>
            {article.subtitle && <p className="text-xl md:text-2xl text-tuwa-muted font-light max-w-2xl mx-auto leading-relaxed">{article.subtitle}</p>}
            
            <div className="mt-12 flex items-center justify-center space-x-4 border-y border-white/5 py-8 flex-wrap gap-y-4">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/?author=${encodeURIComponent(authorName)}`)}>
                {authorAvatar ? (
                  <SkeletonImage src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-tuwa-accent flex items-center justify-center font-bold text-xs text-white uppercase">{authorInitials}</div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-white hover:text-tuwa-accent transition-colors flex items-center gap-1">{authorName}{(authorRole === 'Founder and Editor-in-Chief' || authorRole === 'Developer') && <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1D9BF0"/><path d="M9.5 12.5L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</p>
                  <p className="text-xs text-tuwa-muted">Author</p>
                </div>
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{publishedDate}</p>
                <p className="text-xs text-tuwa-muted">{article.read_time_minutes || 5} min read</p>
              </div>
            </div>
          </div>
        </section>

        <article className="max-w-[720px] mx-auto px-6 py-20 prose prose-invert prose-xl text-tuwa-text" dangerouslySetInnerHTML={{ __html: article.content_html || '<p>No content available.</p>' }} />

        {!inRecZone && (
        <aside className={`fixed right-4 top-28 w-64 hidden lg:block transition-all duration-500 ${showSidebar ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <div className="bg-[rgba(10,10,11,0.75)] border border-white/[0.06] rounded-2xl p-3 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="mb-3 px-1">
              <span className="text-[10px] tracking-widest font-bold uppercase text-tuwa-muted/70">Trending Now</span>
            </div>
            <div className="space-y-0.5">
              {recommended.slice(0, 5).map((a) => (
                <a
                  key={a.slug}
                  href={`/articles/${a.slug}?`}
                  className="group flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0">
                    <SkeletonImage
                      src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white/70 group-hover:text-white leading-snug line-clamp-2 transition-colors duration-200">{a.title}</div>
                    <div className="text-[10px] text-tuwa-muted/50 mt-0.5 group-hover:text-tuwa-muted/80 transition-colors duration-200">{a.read_time_minutes || 5} min</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>
        )}

        <RevealSection>
          <section ref={recommendedSectionRef} className="max-w-6xl mx-auto px-6 pb-20">
            <h3 className="text-2xl font-bold text-white mb-6">Recommended For You</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommended.length === 0 ? <div className="text-tuwa-muted col-span-full">No recommendations available.</div> : null}
              {recommended.slice(0, 24).map(a => (
                <a key={a.slug} href={`/articles/${a.slug}?`} className="group block rounded-xl overflow-hidden bg-tuwa-gray border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-200">
                  <div className="w-full h-36 overflow-hidden">
                    <SkeletonImage src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-snug">{a.title}</h4>
                    <div className="text-[10px] text-tuwa-muted/70">
                      {a.published_at ? new Date(a.published_at).toLocaleDateString() : ''} · {a.read_time_minutes || 5} min
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </RevealSection>

        <RevealSection>
          <section id="subscription-cta" className="bg-tuwa-gray py-24 px-6 border-t border-white/5">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-white">Stay Ahead of the Curve</h2>
              <p className="text-tuwa-muted mb-10 text-lg">Join thinkers, researchers and journalists receiving our daily deep-dives into the view of the world.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 justify-center relative">
                <input value={email} onChange={e => setEmail(e.target.value)} required className="bg-tuwa-black border border-white/10 rounded-full px-8 py-4 w-full md:w-96 text-white focus:outline-none focus:border-tuwa-accent focus:ring-1 focus:ring-tuwa-accent transition-all placeholder:text-tuwa-muted/50" placeholder="Enter your email" type="email" />
                <button disabled={subStatus.loading} className="bg-tuwa-accent hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-full transition-all disabled:opacity-50 min-w-[160px]" type="submit">
                  {subStatus.loading ? 'Wait...' : 'Join the Lab'}
                </button>
                <div className={`absolute -bottom-8 left-0 right-0 text-sm font-medium transition-opacity duration-300 ${subStatus.message ? 'opacity-100' : 'opacity-0'} ${subStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{subStatus.message}</div>
              </form>
            </div>
          </section>
        </RevealSection>
      </main>

      <Footer />
    </div>
  );
}