'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function LegalContent() {
  const [activeTab, setActiveTab] = useState('eua');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
  const dropdownRef = useRef(null);
  const navTabsRef = useRef(null);

  const tocData = {
    eua: [
      { id: 'eua-1', text: '1. The Service Provided by Us', i18n: 'eua_sec1_title' },
      { id: 'eua-2', text: '2. Your Use of the Service', i18n: 'eua_sec2_title' },
      { id: 'eua-3', text: '3. Intellectual Property Rights', i18n: 'eua_sec3_title' },
      { id: 'eua-4', text: '4. Problems and Disputes', i18n: 'eua_sec4_title' }
    ],
    privacy: [
      { id: 'priv-1', text: '1. Personal Data We Collect', i18n: 'priv_sec1_title' },
      { id: 'priv-2', text: '2. Our Purpose for Using Data', i18n: 'priv_sec2_title' },
      { id: 'priv-3', text: '3. Keeping Your Data Safe', i18n: 'priv_sec3_title' },
      { id: 'priv-4', text: '4. Your Data Rights', i18n: 'priv_sec4_title' }
    ],
    cookie: [
      { id: 'cook-1', text: '1. Essential Cookies', i18n: 'cookie_title_1' },
      { id: 'cook-2', text: '2. Local Storage', i18n: 'cookie_title_2' },
      { id: 'cook-3', text: '3. Analytics and Performance', i18n: 'cookie_title_3' }
    ]
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkScrollIndicator = () => {
    if (navTabsRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = navTabsRef.current;
      if (scrollWidth <= clientWidth || (Math.ceil(scrollLeft) + clientWidth >= scrollWidth - 5)) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    }
  };

  useEffect(() => {
    checkScrollIndicator();
    window.addEventListener('resize', checkScrollIndicator);
    return () => window.removeEventListener('resize', checkScrollIndicator);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLanguageChange = (lang) => {
    setCurrentLang(lang);
    setIsLangDropdownOpen(false);
    localStorage.setItem('tuwa_lang', lang);
  };

  return (
    <div className="tuwa-upgrade font-sans antialiased bg-[#030303] text-white min-h-screen">
      <nav className="top-nav relative z-50 p-4 border-b border-white/10 flex justify-between items-center">
        <span className="text-2xl font-extrabold tracking-tighter font-heading text-white" data-i18n="header_title">OpenTuwa&reg; Legal</span>
        
        <div className="nav-tabs-container relative flex-1 max-w-md mx-8 overflow-hidden">
            <div 
              className="nav-tabs flex space-x-4 overflow-x-auto scrollbar-hide" 
              id="navTabs" 
              ref={navTabsRef}
              onScroll={checkScrollIndicator}
            >
                <button 
                  className={`tab-btn whitespace-nowrap px-4 py-2 text-sm transition-colors ${activeTab === 'eua' ? 'text-white border-b-2 border-tuwa-accent' : 'text-tuwa-muted hover:text-white'}`} 
                  onClick={() => { setActiveTab('eua'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  End User Agreement
                </button>
                <button 
                  className={`tab-btn whitespace-nowrap px-4 py-2 text-sm transition-colors ${activeTab === 'privacy' ? 'text-white border-b-2 border-tuwa-accent' : 'text-tuwa-muted hover:text-white'}`} 
                  onClick={() => { setActiveTab('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Privacy Policy
                </button>
                <button 
                  className={`tab-btn whitespace-nowrap px-4 py-2 text-sm transition-colors ${activeTab === 'cookie' ? 'text-white border-b-2 border-tuwa-accent' : 'text-tuwa-muted hover:text-white'}`} 
                  onClick={() => { setActiveTab('cookie'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Cookie Policy
                </button>
            </div>
            
            {showScrollIndicator && (
              <div className="scroll-indicator absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-[#030303] to-transparent w-12 h-full flex items-center justify-end pointer-events-none pr-1">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
              </div>
            )}
        </div>

        <div className="lang-dropdown-container relative" ref={dropdownRef}>
            <button 
              className="lang-dropdown-btn flex items-center space-x-2 text-sm text-tuwa-muted hover:text-white transition-colors" 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              aria-expanded={isLangDropdownOpen}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c-.96 1.66-2.49 2.93-4.33 3.56C5.81 8.45 6.27 7.25 6.59 6zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.34.16-2h4.68c.09.66.16 1.32.16 2s-.07 1.34-.16 2zm1.28 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.66-2.49 2.93-4.33 3.56zM16.22 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                </svg>
                <span className="hidden md:inline">Language</span>
            </button>
            
            {isLangDropdownOpen && (
              <div className="lang-dropdown-menu absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                  <button className="w-full text-left px-4 py-2 text-sm text-tuwa-muted hover:text-white hover:bg-white/5" onClick={() => handleLanguageChange('en')}>English</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-tuwa-muted hover:text-white hover:bg-white/5" onClick={() => handleLanguageChange('es')}>Español (Spanish)</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-tuwa-muted hover:text-white hover:bg-white/5" onClick={() => handleLanguageChange('ar')}>العربية (Arabic)</button>
              </div>
            )}
        </div>
      </nav>

      <main className="page-container max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
          
          <aside className="sidebar w-full md:w-64 shrink-0">
              <div className="sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-widest text-tuwa-muted mb-6">Contents</h3>
                <ul className="toc-list space-y-4" id="toc">
                    {tocData[activeTab].map((item) => (
                      <li key={item.id}>
                        <a 
                          href={`#${item.id}`} 
                          onClick={(e) => scrollToSection(e, item.id)}
                          className="text-sm text-tuwa-muted hover:text-white hover:underline transition-colors"
                          data-i18n={item.i18n}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
          </aside>

          <div className="content-area flex-1 max-w-3xl">

              <article id="eua" className={`policy-section transition-opacity duration-300 ${activeTab === 'eua' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4" data-i18n="eua_title">Tuwa End User Agreement</h1>
                  <div className="text-sm text-tuwa-muted mb-12" data-i18n="eua_eff">Effective as of: August 26, 2025</div>

                  <div className="glass-panel space-y-10 text-tuwa-text leading-relaxed">
                      <p data-i18n="eua_desc">Hello! Welcome to the Tuwa&trade; End User Agreement ("<strong>Terms</strong>") which apply when you use the Tuwa application, a brand of OpenTuwa&reg;. These Terms govern your use of our distraction-free Quran audio streaming and reading services (the "<strong>Service</strong>").</p>

                      <section id="eua-1" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="eua_sec1_title">1. The Service Provided by Us</h2>
                          <p data-i18n="eua_sec1_text">Tuwa&trade; provides a specialized, distraction-free environment for Quran audio streaming and text reading. The Service is provided entirely free of charge. To access the full application and maintain personalized settings securely, users must authenticate prior to use.</p>
                      </section>

                      <section id="eua-2" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="eua_sec2_title">2. Your Use of the Service</h2>
                          <p className="mb-4" data-i18n="eua_sec2_text">You agree to use the Service solely for personal, non-commercial listening and study. To protect the integrity of our platform and the rights of our content licensors, the following activities are strictly prohibited:</p>
                          <ul className="list-disc pl-6 space-y-2">
                              <li data-i18n="eua_sec2_li1">Using automated tools, scrapers, or crawlers to extract audio, text, or data from the Service.</li>
                              <li data-i18n="eua_sec2_li2">Attempting to download, redistribute, or circumvent the security measures protecting our media streams.</li>
                              <li data-i18n="eua_sec2_li3">Reverse-engineering, decompiling, or attempting to bypass our application architecture or access controls.</li>
                          </ul>
                      </section>

                      <section id="eua-3" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="eua_sec3_title">3. Content and Intellectual Property Rights</h2>
                          <p data-i18n="eua_sec3_text">The Tuwa&trade; platform, including its interface, design, software, and brand elements, is the proprietary intellectual property of OpenTuwa&reg;. The audio recitations and translated texts are licensed content and remain the exclusive property of their respective owners or rights holders.</p>
                      </section>

                      <section id="eua-4" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="eua_sec4_title">4. Problems and Disputes</h2>
                          <p className="mb-4" data-i18n="eua_sec4_text">The Service is provided on an "as is" and "as available" basis without warranties of any kind. To the maximum extent permitted by applicable law, OpenTuwa&reg; shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the Service.</p>
                          <p data-i18n="eua_sec5_text">This Agreement shall be governed by and construed in accordance with the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Johor, Malaysia.</p>
                      </section>
                      <section id="eua-5" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="eua_sec5_title">5. BY ACCESSING OR USING THIS PLATFORM, YOU ACKNOWLEDGE AND AGREE TO THE FOLLOWING TERMS:</h2>
                          <p className="mb-4" data-i18n="eua_sec4_text"><strong>i. Automated Processing.</strong> This platform utilizes an artificial intelligence-based recommendation system ("Algorithm") that analyzes available content and user interactions to generate suggestions. This process is fully automated.</p>
                          <p data-i18n="eua_sec5_text"><strong>ii. No Liability for Output.</strong> The Algorithm may generate recommendations that are unexpected, inaccurate, or objectionable. The website operator expressly disclaims all liability for any content suggested by the Algorithm or any reliance thereon. You use this website and engage with its content at your sole discretion and risk.</p>
                          <p data-i18n="eua_sec5_text"><strong>iii. Binding Effect.</strong> By continuing to browse, click, or interact with this website in any manner, you irrevocably agree to be bound by this Notice, our full Terms of Service, and our Privacy Policy. If you do not agree, you must immediately exit and discontinue all use of this website.</p>
                          <p data-i18n="eua_sec5_text"><strong>iv. Implied Consent.</strong> Your access constitutes your explicit consent to the data processing described in our Privacy Policy, including the use of cookies and the collection of interaction data for the purpose of training, refining, and operating the Algorithm.</p>
                          <p data-i18n="eua_sec5_text"><strong>v. No Withdrawal of Consent Post-Access.</strong> Once you have accessed the website, you cannot retroactively withdraw consent for the data processing that occurred during your visit. Any request to delete data will be handled as specified in our Privacy Policy but does not nullify the legality of processing that occurred prior to such request.</p>
                      </section>
                  </div>
              </article>

              <article id="privacy" className={`policy-section transition-opacity duration-300 ${activeTab === 'privacy' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4" data-i18n="priv_title">Tuwa Privacy Policy</h1>
                  <div className="text-sm text-tuwa-muted mb-12" data-i18n="priv_eff">Effective as of: August 26, 2025</div>

                  <div className="glass-panel space-y-10 text-tuwa-text leading-relaxed">
                      <p data-i18n="priv_desc">At Tuwa&trade;, we believe in data minimization. This Privacy Policy outlines our strict practices regarding the limited information we process to keep our Service running securely.</p>

                      <section id="priv-1" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="priv_sec1_title">1. Personal Data We Collect</h2>
                          <ul className="list-disc pl-6 space-y-2">
                              <li data-i18n="priv_sec1_li1"><strong>Information You Provide:</strong> When you utilize our search functionality, queries are processed in real-time. We do not store these search logs on our servers.</li>
                              <li data-i18n="priv_sec1_li2"><strong>Security & Infrastructure Data:</strong> To secure our platform, we collect standard network data (e.g., IP address, basic device identifiers). This is processed dynamically to authorize secure media streams.</li>
                              <li data-i18n="priv_sec1_li3"><strong>Authentication Data:</strong> Upon login, we receive a secure session token. We do not read, store, or process your external personal profile data, emails, or passwords.</li>
                          </ul>
                      </section>

                      <section id="priv-2" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="priv_sec2_title">2. Our Purpose for Using Data</h2>
                          <p className="mb-4" data-i18n="priv_sec2_text">The minimal data we interact with is strictly utilized to:</p>
                          <ul className="list-disc pl-6 space-y-2">
                              <li data-i18n="priv_sec2_li1">Authenticate your secure access to the application.</li>
                              <li data-i18n="priv_sec2_li2">Protect licensed audio content from unauthorized distribution.</li>
                              <li data-i18n="priv_sec2_li3">Analyze aggregate, non-identifiable usage trends to maintain server stability.</li>
                          </ul>
                      </section>

                      <section id="priv-3" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="priv_sec3_title">3. Keeping Your Data Safe</h2>
                          <p data-i18n="priv_sec3_text">We do not sell your personal data. Infrastructure data is processed solely to operate secure hosting and authentication. We utilize industry-standard encryption (HTTPS/TLS) and strict access controls to protect all data in transit.</p>
                      </section>

                      <section id="priv-4" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="priv_sec4_title">4. Your Data Rights and Controls</h2>
                          <p data-i18n="priv_sec4_text">Because we do not maintain a centralized user database, your personal preferences (such as playback history and theme choices) are stored locally on your device. You maintain full control and can delete this data at any time using your browser settings or our in-app wipe feature.</p>
                      </section>
                  </div>
              </article>

              <article id="cookie" className={`policy-section transition-opacity duration-300 ${activeTab === 'cookie' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4" data-i18n="cookie_title">Tuwa Cookie Policy</h1>
                  <div className="text-sm text-tuwa-muted mb-12" data-i18n="cookie_eff">Effective as of: August 26, 2025</div>

                  <div className="glass-panel space-y-10 text-tuwa-text leading-relaxed">
                      <p data-i18n="cookie_desc">This Cookie Policy explains how Tuwa&trade; uses cookies and local storage technologies to provide a seamless, secure experience.</p>

                      <section id="cook-1" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="cookie_title_1">1. Essential Cookies</h2>
                          <p data-i18n="cookie_li1">We use strictly necessary cookies to authenticate your access and maintain a secure session. If you disable these cookies through your browser, our security protocols will require you to log out and re-authenticate.</p>
                      </section>

                      <section id="cook-2" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="cookie_title_2">2. Local Storage for Preferences</h2>
                          <p data-i18n="cookie_li2">Instead of tracking your settings on our servers, we use your device's <code>localStorage</code> to save your playback state, reading preferences, and interface choices. This ensures your privacy while allowing you to seamlessly resume recitations.</p>
                      </section>

                      <section id="cook-3" className="scroll-mt-32">
                          <h2 className="text-2xl font-bold text-white mb-4" data-i18n="cookie_title_3">3. Analytics and Performance</h2>
                          <p data-i18n="cookie_li3">We utilize lightweight infrastructure cookies to understand aggregate platform health and load balancing, ensuring the Service remains fast and reliable without tracking your personal identity.</p>
                      </section>
                  </div>
              </article>

              <div className="mt-20 pt-8 border-t border-white/10 text-sm text-tuwa-muted"> 
                  <span data-i18n="footer_copy">&copy; 2026 OpenTuwa&reg; Labs. All rights reserved.</span> <br/>
                  <a data-i18n="footer_contact" href="mailto:founder@opentuwa.com" className="text-tuwa-accent hover:text-white transition-colors underline-offset-4 underline decoration-tuwa-accent/50 mt-2 inline-block">Contact us</a>.
              </div>
              
              <div className="mt-8 flex space-x-6">
                  <a href="https://x.com/OpenTuwa" target="_blank" rel="noopener noreferrer" aria-label="Follow us on X" className="text-tuwa-muted hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                      </svg>
                  </a>
              </div>

          </div>
      </main>
    </div>
  );
}
