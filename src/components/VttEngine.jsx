'use client';

import { useEffect } from 'react';

/**
 * VttEngine - Logic-only component for VTT subtitle processing
 * 
 * This component encapsulates all VTT subtitle processing logic in an isolated component.
 * It accepts articleRef (React ref to article DOM), slug (for debugging), and htmlContent.
 * Returns null (logic-only, no visual output).
 * 
 * The key={slug} prop on this component forces React to unmount/remount on navigation,
 * ensuring complete cleanup of intervals, event listeners, and YouTube players.
 */
export default function VttEngine({ articleRef, slug, htmlContent }) {
  useEffect(() => {
    if (!htmlContent) return;

    // Capture the article DOM element at the moment this effect starts.
    const articleEl = articleRef.current;
    if (!articleEl) return;

    // Use AbortController to cancel in-flight VTT fetches on cleanup.
    const abortController = new AbortController();
    let isActive = true;
    
    // Use a WeakSet to track in-flight requests in memory.
    // This solves the race condition where DOM flags might be read/cleared concurrently.
    const inFlightElements = new WeakSet();

    const cleanupFns = [];
    cleanupFns.push(() => {
      isActive = false;
      abortController.abort();
    });

    // Wipe any stale vtt-processed flags and overlays from THIS article's DOM.
    const querySelectorStr = 'video, audio, iframe, .tuwa-subtitle-box';
    const staleElements = articleEl.querySelectorAll(querySelectorStr);
    staleElements.forEach(el => el.removeAttribute('data-vtt-processed'));
    const staleOverlays = articleEl.querySelectorAll('.tuwa-subtitle-overlay');
    staleOverlays.forEach(overlay => overlay.remove());

    const parseVttTime = (timeStr) => {
      if (!timeStr) return 0;
      const clean = timeStr.trim().split(/\s+/)[0].replace(',', '.');
      const parts = clean.split(':');
      let seconds = 0;
      if (parts.length === 3) {
        seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      } else {
        seconds = parseFloat(parts[0]);
      }
      return seconds || 0;
    };

    const parseVtt = (vttText) => {
      const cues = [];
      const lines = vttText.replace(/\r\n/g, '\n').split('\n');
      let currentCue = null;
      for (let line of lines) {
        line = line.trim();
        if (!line) {
          if (currentCue && currentCue.textLines.length > 0) {
            cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
          }
          currentCue = null;
          continue;
        }
        if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:') || line.startsWith('NOTE')) continue;
        if (line.includes('-->')) {
          if (currentCue && currentCue.textLines.length > 0) {
            cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
          }
          const times = line.split('-->');
          currentCue = { start: parseVttTime(times[0]), end: parseVttTime(times[1]), textLines: [] };
        } else if (currentCue) {
          if (!line.match(/^\d+$/) || currentCue.textLines.length > 0) {
            currentCue.textLines.push(line);
          }
        }
      }
      if (currentCue && currentCue.textLines.length > 0) {
        cues.push({ start: currentCue.start, end: currentCue.end, text: currentCue.textLines.join('<br>') });
      }
      return cues;
    };

    const createOverlay = (container, isStandaloneBox) => {
      const existing = container.querySelector('.tuwa-subtitle-overlay');
      if (existing) return existing;

      const overlay = document.createElement('div');
      overlay.className = 'tuwa-subtitle-overlay';
      overlay.style.zIndex = '9999';
      overlay.style.padding = '0 20px';
      overlay.style.boxSizing = 'border-box';
      overlay.style.minHeight = '44px';
      overlay.style.display = 'block';
      overlay.style.width = '100%';
      overlay.style.textAlign = 'center';

      if (isStandaloneBox) {
        overlay.style.position = 'relative';
        overlay.style.marginTop = '10px';
      } else {
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') container.style.position = 'relative';
        overlay.style.position = 'absolute';
        overlay.style.bottom = '8%';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
      }

      container.appendChild(overlay);
      return overlay;
    };

    const attachSubtitleUpdater = (overlay, cues, mediaEl, cleanupFns) => {
      let lastCueText = null;

      const updateSubtitle = (currentTime) => {
        if (!isActive) return;
        const activeCue = cues.find(c => currentTime >= c.start && currentTime <= c.end);
        const newText = activeCue ? activeCue.text : null;
        if (newText === lastCueText) return;
        lastCueText = newText;

        if (newText) {
          overlay.innerHTML = `<span style="background:rgba(0,0,0,0.82);color:#fff;padding:5px 14px;border-radius:6px;font-size:1.05rem;line-height:1.6;display:inline-block;text-shadow:1px 1px 2px #000;font-family:sans-serif;">${newText}</span>`;
        } else {
          overlay.innerHTML = '';
        }
      };

      const tag = mediaEl.tagName.toLowerCase();

      if (tag === 'video' || tag === 'audio') {
        updateSubtitle(mediaEl.currentTime || 0);
        const onTimeUpdate = () => updateSubtitle(mediaEl.currentTime);
        mediaEl.addEventListener('timeupdate', onTimeUpdate);
        cleanupFns.push(() => mediaEl.removeEventListener('timeupdate', onTimeUpdate));

      } else if (tag === 'iframe') {
        if (!mediaEl.id) mediaEl.id = `yt-iframe-${Math.random().toString(36).substr(2, 9)}`;

        if (mediaEl.src && (mediaEl.src.includes('youtube.com') || mediaEl.src.includes('youtu.be'))) {
          try {
            const url = new URL(mediaEl.src);
            if (!url.searchParams.has('enablejsapi')) {
              url.searchParams.set('enablejsapi', '1');
              mediaEl.src = url.toString();
            }
          } catch (e) {
            if (!mediaEl.src.includes('enablejsapi=1')) {
              mediaEl.src += (mediaEl.src.includes('?') ? '&' : '?') + 'enablejsapi=1';
            }
          }
        }

        let pollingStarted = false;
        let ytPlayerInstance = null;

        const startYTPolling = (ytPlayer) => {
          if (pollingStarted || !isActive) return;
          pollingStarted = true;
          const interval = setInterval(() => {
            if (!isActive) { clearInterval(interval); return; }
            try {
              if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
                updateSubtitle(ytPlayer.getCurrentTime());
              }
            } catch (e) { }
          }, 100);
          cleanupFns.push(() => clearInterval(interval));
        };

        const setupYT = () => {
          if (!isActive) return;
          const ytPlayer = new window.YT.Player(mediaEl, {
            events: {
              onReady: (e) => {
                if (!isActive) {
                  try { e.target.destroy(); } catch (_) {}
                  return;
                }
                ytPlayerInstance = e.target;
                startYTPolling(e.target);
              }
            }
          });
          cleanupFns.push(() => {
            try {
              if (ytPlayerInstance) {
                ytPlayerInstance.destroy();
                ytPlayerInstance = null;
              } else {
                ytPlayer.destroy();
              }
            } catch (_) {}
          });
        };

        if (window.YT && window.YT.Player) {
          setupYT();
        } else {
          if (!window.ytQueue) window.ytQueue = [];
          window.ytQueue.push(setupYT);
        }
      }
    };

    const initSingleSubtitle = async (targetEl) => {
      if (!isActive) return;
      
      // Early return if already processed OR actively in flight
      if (
        inFlightElements.has(targetEl) ||
        targetEl.dataset.vttProcessed === 'true' ||
        targetEl.dataset.vttProcessed === 'ignored' ||
        targetEl.dataset.vttProcessed === 'error'
      ) return;
      
      let mediaEl = null;
      let container = null;
      let mediaId = null;
      let vttUrl = null;
      let isStandaloneBox = false;

      if (targetEl.classList.contains('tuwa-subtitle-box')) {
        isStandaloneBox = true;
        container = targetEl;
        mediaId  = targetEl.dataset.video || targetEl.dataset.youtube || null;
        vttUrl   = targetEl.dataset.vtt   || null;
        mediaEl = targetEl.querySelector('video, audio, iframe');

        if (!mediaEl && mediaId) {
          mediaEl = (articleEl ? articleEl.querySelector(`#${CSS.escape(mediaId)}`) : null)
                 || (articleEl ? articleEl.querySelector(`[data-media-id="${CSS.escape(mediaId)}"]`) : null);
        }
      } else {
        mediaEl   = targetEl;
        mediaId   = targetEl.id || targetEl.dataset.mediaId || null;
        vttUrl    = targetEl.dataset.vtt || null;
        container = targetEl.parentElement;

        if (!vttUrl) {
          const box = targetEl.closest('.tuwa-subtitle-box');
          if (box) {
            mediaId   = mediaId || box.dataset.video || box.dataset.youtube || null;
            vttUrl    = box.dataset.vtt || null;
            container = box;
            isStandaloneBox = true;
          }
        }
      }

      if (!vttUrl) {
        targetEl.dataset.vttProcessed = 'ignored';
        return;
      }
      
      if (!mediaEl) return; 

      if (!container) container = mediaEl.parentElement;

      // Mark element as in-flight and pending
      inFlightElements.add(targetEl);
      targetEl.dataset.vttProcessed = 'pending';

      try {
        const response = await fetch(vttUrl, { signal: abortController.signal });
        if (!isActive) return;
        
        if (!response.ok) {
          targetEl.dataset.vttProcessed = 'error';
          inFlightElements.delete(targetEl);
          return;
        }
        
        const vttText = await response.text();
        if (!isActive) return;
        
        const cues = parseVtt(vttText);

        if (cues.length > 0) {
          const overlay = createOverlay(container, isStandaloneBox);
          attachSubtitleUpdater(overlay, cues, mediaEl, cleanupFns);
          targetEl.dataset.vttProcessed = 'true';
        } else {
          targetEl.dataset.vttProcessed = 'error';
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isActive) {
          targetEl.dataset.vttProcessed = 'error';
          inFlightElements.delete(targetEl);
          console.error('[VttEngine] Critical Error:', error);
        }
      }
    };

    const scanAndInit = () => {
      // Ensure the element is still connected to the DOM before scanning
      if (!isActive || !articleEl || !articleEl.isConnected) return;
      const elements = articleEl.querySelectorAll(querySelectorStr);
      elements.forEach(el => initSingleSubtitle(el));
    };

    // Wait for content to be actually rendered in the DOM
    // Use a combination of requestAnimationFrame and a small timeout
    // to ensure dangerouslySetInnerHTML has completed
    const initializeVtt = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!isActive) return;
          scanAndInit();
        }, 50); // Small delay to ensure DOM is fully updated
      });
    };

    initializeVtt();
    
    const pollInterval = setInterval(scanAndInit, 1000);
    setTimeout(() => clearInterval(pollInterval), 10000);
    cleanupFns.push(() => clearInterval(pollInterval));

    const mutationObserver = new MutationObserver(() => scanAndInit());
    mutationObserver.observe(articleEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    if (!window.tuwaYTInitialized) {
      window.tuwaYTInitialized = true;
      const originalYTReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (originalYTReady) originalYTReady();
        (window.ytQueue || []).forEach(fn => fn());
        window.ytQueue = [];
      };
    }
    
    if (articleEl.querySelector('iframe') && !document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }

    return () => {
      mutationObserver.disconnect();
      cleanupFns.forEach(fn => fn());

      try {
        const els = articleEl.querySelectorAll(querySelectorStr);
        els.forEach(el => el.removeAttribute('data-vtt-processed'));
        const overlays = articleEl.querySelectorAll('.tuwa-subtitle-overlay');
        overlays.forEach(o => { o.innerHTML = ''; o.remove(); });
      } catch (_) {}
    };

  }, [articleRef, slug, htmlContent]);

  return null;
}
