import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ArticleLayout() {
  const { slug } = useParams(); // Automatically grabs the URL slug!
  const navigate = useNavigate();
  
  // State for Article & Recommendations
  const [article, setArticle] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for UI Effects
  const [readingProgress, setReadingProgress] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for Subscribe Form
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState({ loading: false, message: '', type: '' });

  // 1. Fetch Article and Recommendations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Current Article
        const res = await fetch(`/api/article/${slug}`);
        if (!res.ok) throw new Error('Article could not be found.');
        const articleData = await res.json();
        setArticle(articleData);

        // Fetch Recommendations (All articles, minus this one)
        const recRes = await fetch('/api/article');
        if (recRes.ok) {
          const allArticles = await recRes.json();
          const filtered = allArticles
            .filter(a => a.slug && a.slug !== slug)
            .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
            .slice(0, 3);
          setRecommended(filtered);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // 2. Scroll Listeners (Progress Bar, Header Blur, Trending Sidebar)
  useEffect(() => {
    let hideTimer = null;
    let rafPending = false;

    const handleScroll = () => {
      // Header Blur Logic
      const threshold = article?.image_url ? (window.innerHeight * 0.8) - 80 : 50;
      setHeaderScrolled(window.scrollY > threshold);

      // Reading Progress Logic
      const total = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const pct = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
      setReadingProgress(pct);

      // Trending Sidebar Logic
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          if (window.innerWidth >= 1024) {
            setShowSidebar(true);
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setShowSidebar(false), 2000);
          }
          rafPending = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Trigger once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  // 3. Hybrid Subtitles Initialization (Runs after article content loads)
  useEffect(() => {
    if (!article || !article.content_html) return;

    const initHybridSubtitles = async () => {
      const subtitleBoxes = document.querySelectorAll('.tuwa-subtitle-box');
      if (subtitleBoxes.length === 0) return;

      let needsYouTubeAPI = false;
      const ytPlayersQueue = [];

      for (const box of subtitleBoxes) {
        const mediaId = box.dataset.video || box.dataset.youtube; 
        const vttUrl = box.dataset.vtt;
        const mediaEl = document.getElementById(mediaId);
        
        if (!mediaEl || !vttUrl) continue;

        try {
          const response = await fetch(vttUrl);
          if (!response.ok) throw new Error(`VTT missing`);
          const vttText = await response.text();
          
          const cues = [];
          const lines = vttText.replace(/\r\n/g, '\n').split('\n');
          let currentCue = null;

          const parseVttTime = (timeStr) => {
            const parts = timeStr.trim().replace(',', '.').split(':');
            return parts.length === 3 
              ? parseFloat(parts[0])*3600 + parseFloat(parts[1])*60 + parseFloat(parts[2])
              : parseFloat(parts[0])*60 + parseFloat(parts[1]);
          };

          for (let line of lines) {
            line = line.trim();
            if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) continue;

            if (line.includes('-->')) {
              if (currentCue && currentCue.textLines.length > 0) {
                cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
              }
              const times = line.split('-->');
              currentCue = { start: parseVttTime(times[0]), end: parseVttTime(times[1]), textLines: [] };
            } else if (line !== '') {
              if (currentCue) currentCue.textLines.push(line);
            } else if (line === '' && currentCue) {
              if (currentCue.textLines.length > 0) {
                cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
              }
              currentCue = null;
            }
          }
          if (currentCue && currentCue.textLines.length > 0) {
            cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
          }

          const updateSubtitle = (currentTime) => {
            const activeCue = cues.find(c => currentTime >= c.start && currentTime <= c.end);
            box.innerHTML = activeCue ? `<span class="active-text">${activeCue.text}</span>` : '';
          };

          if (mediaEl.tagName.toLowerCase() === 'video') {
            updateSubtitle(0);
            mediaEl.addEventListener('timeupdate', () => updateSubtitle(mediaEl.currentTime));
            mediaEl.addEventListener('seeked', () => updateSubtitle(mediaEl.currentTime));
          } else if (mediaEl.tagName.toLowerCase() === 'iframe') {
            needsYouTubeAPI = true;
            ytPlayersQueue.push({ id: mediaId, render: updateSubtitle });
          }

        } catch (error) {
          console.error('Subtitle Engine Error:', error);
          box.style.display = 'none';
        }
      }

      if (needsYouTubeAPI && window.YT) {
         ytPlayersQueue.forEach(p => {
          new window.YT.Player(p.id, {
            events: {
              'onReady': (event) => {
                setInterval(() => {
                  if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
                    p.render(event.target.getCurrentTime());
                  }
                }, 100);
              }
            }
          });
        });
      }
    };

    // Small delay to ensure injected HTML is fully in the DOM
    setTimeout(initHybridSubtitles, 500);
  }, [article]);

  // Handlers
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
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

  // --------------------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------------------

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

  // Formatting variables
  const publishedDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    : 'Recently published';
  
  const authorName = article.author || 'Tuwa Media';
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const tagsArray = article.tags ? article.tags.split(',').map(t => t.trim()) : [];

  return (
    <div className="tuwa-upgrade selection-highlight bg-[rgba(10,10,11,1)] min-h-screen text-white">
      
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${headerScrolled ? 'backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-white/5' : 'border-transparent'}`} data-purpose="sticky-navigation">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a className="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">Tuwa</a>
            <div className={`hidden lg:flex items-center space-x-6 text-sm font-medium text-tuwa-muted transition-opacity ${headerScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <a className="hover:text-white transition-colors" href="/">Stories</a>
              <a className="hover:text-white transition-colors" href="/archive">Archive</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search stories" 
                className="bg-tuwa-black/60 text-sm text-white placeholder:text-tuwa-muted/60 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-tuwa-accent" 
              />
            </div>
            <a className="text-xs text-tuwa-muted hover:text-white cursor-pointer" onClick={() => document.getElementById('subscription-cta').scrollIntoView({ behavior: 'smooth' })}>
              Subscribe
            </a>
          </div>
        </nav>
        {/* Progress Bar */}
        <div className="fixed left-0 top-0 h-[3px] bg-gradient-to-r from-tuwa-accent to-tuwa-gold z-60 transition-all duration-150" style={{ width: `${readingProgress}%` }}></div>
      </header>

      <main>
        {/* Hero Section */}
        {article.image_url && (
          <section className="relative w-full h-[80vh] overflow-hidden">
            <img alt={article.title} className="w-full h-full object-cover transform scale-105" src={article.image_url}/>
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,11,1)] via-[rgba(10,10,11,0.6)] to-transparent"></div>
          </section>
        )}

        {/* Article Meta Header */}
        <section className={`relative z-10 px-6 ${article.image_url ? '-mt-40' : 'pt-40'}`}>
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {tagsArray.map((tag, idx) => (
                <button key={idx} onClick={() => navigate(`/?tag=${encodeURIComponent(tag)}`)} className="px-3 py-1 border border-white/10 rounded-full text-[10px] tracking-widest font-bold uppercase hover:bg-white/10 transition-colors text-white">
                  {tag}
                </button>
              ))}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] text-slate-50">{article.title}</h1>
            {article.subtitle && <p className="text-xl md:text-2xl text-tuwa-muted font-light max-w-2xl mx-auto leading-relaxed">{article.subtitle}</p>}
            
            <div className="mt-12 flex items-center justify-center space-x-4 border-y border-white/5 py-8 flex-wrap gap-y-4">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/?author=${encodeURIComponent(authorName)}`)}>
                <div className="w-10 h-10 rounded-full bg-tuwa-accent flex items-center justify-center font-bold text-xs text-white uppercase">
                  {authorInitials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white hover:text-tuwa-accent transition-colors">{authorName}</p>
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

        {/* The Body Content (Injected directly from Database) */}
        <article 
          className="max-w-[720px] mx-auto px-6 py-20 prose prose-invert prose-xl text-tuwa-text"
          dangerouslySetInnerHTML={{ __html: article.content_html || '<p>No content available.</p>' }}
        />

        {/* Trending Sidebar */}
        <aside className={`fixed right-6 top-32 w-80 hidden lg:block transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-tuwa-gray/60 border border-white/5 rounded-xl p-4 sticky top-32 backdrop-blur-md">
            <h4 className="text-white font-bold mb-3">Trending</h4>
            <div className="space-y-3 text-sm">
              {recommended.map(a => (
                <a key={a.slug} href={`/articles/${a.slug}`} className="flex items-start gap-3 hover:underline">
                  <img src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'} className="w-12 h-8 object-cover rounded-md" alt={a.title} />
                  <div>
                    <div className="text-sm text-white font-semibold line-clamp-2">{a.title}</div>
                    <div className="text-xs text-tuwa-muted">{a.read_time_minutes || 5} min</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Recommendations Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h3 className="text-2xl font-bold text-white mb-6">Recommended For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommended.length === 0 ? <div className="text-tuwa-muted">No recommendations available.</div> : null}
            {recommended.map(a => (
              <a key={a.slug} href={`/articles/${a.slug}`} className="block rounded-xl overflow-hidden bg-tuwa-gray border border-white/5 p-4 hover:bg-white/5 transition-colors">
                <div className="w-full h-40 mb-3 overflow-hidden rounded-md">
                  <img src={a.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1 line-clamp-2">{a.title}</h4>
                <div className="text-xs text-tuwa-muted">
                  {a.published_at ? new Date(a.published_at).toLocaleDateString() : ''} • {a.read_time_minutes || 5} min
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Subscribe Footer */}
        <section id="subscription-cta" className="bg-tuwa-gray py-24 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">Stay Ahead of the Curve</h2>
            <p className="text-tuwa-muted mb-10 text-lg">Join thinkers and researchers receiving our daily deep-dives into the view of the world.</p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 justify-center relative">
              <input 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-tuwa-black border border-white/10 rounded-full px-8 py-4 w-full md:w-96 text-white focus:outline-none focus:border-tuwa-accent focus:ring-1 focus:ring-tuwa-accent transition-all placeholder:text-tuwa-muted/50" 
                placeholder="Enter your email" 
                type="email"
              />
              <button disabled={subStatus.loading} className="bg-tuwa-accent hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-full transition-all disabled:opacity-50 min-w-[160px]" type="submit">
                {subStatus.loading ? 'Wait...' : 'Join the Lab'}
              </button>
              
              <div className={`absolute -bottom-8 left-0 right-0 text-sm font-medium transition-opacity duration-300 ${subStatus.message ? 'opacity-100' : 'opacity-0'} ${subStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {subStatus.message}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-extrabold tracking-tighter font-heading text-white">OpenTuwa</div>
          <div className="flex space-x-8 text-xs font-bold tracking-widest uppercase text-tuwa-muted">
            <a className="hover:text-white transition-colors" href="/legal">Terms & Privacy</a>
            <a className="hover:text-white transition-colors" href="/about">About OpenTuwa</a>
            <a className="hover:text-white transition-colors" href="https://x.com/OpenTuwa" target="_blank" rel="noreferrer">X (formerly Twitter)</a>
          </div>
          <div className="text-xs text-tuwa-muted">
            © 2026 OpenTuwa Media. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}