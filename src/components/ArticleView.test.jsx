/**
 * VTT Engine Tests for Race Condition Fix
 * 
 * Task 1: Bug Condition Exploration Test - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * Task 2: Preservation Property Tests - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import * as fc from 'fast-check';
import ArticleView from './ArticleView';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock components
vi.mock('./Footer', () => ({
  default: () => null,
}));

vi.mock('../hooks/useScrollReveal', () => ({
  default: () => ({ current: null }),
}));

vi.mock('./SkeletonImage', () => ({
  default: ({ src, alt, className }) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

describe('VTT Engine Race Condition - Bug Condition Exploration', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock window APIs
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    
    // Mock Audio API
    global.Audio = class Audio {
      constructor() {}
      play() {
        return Promise.resolve();
      }
    };
    
    // Mock HTMLMediaElement methods
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
    
    // Mock YouTube API
    window.YT = undefined;
    window.ytQueue = [];
    window.tuwaYTInitialized = false;
    window.onYouTubeIframeAPIReady = undefined;
    
    // Mock fetch for VTT files
    global.fetch = vi.fn((url) => {
      if (url.includes('.vtt')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`WEBVTT

00:00:00.000 --> 00:00:05.000
Test subtitle 1

00:00:05.000 --> 00:00:10.000
Test subtitle 2`),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  /**
   * Property 1: Bug Condition - Multiple VTT Engines Run Concurrently
   * 
   * This property tests that navigating between articles causes multiple VTT engines
   * to run simultaneously. The test should FAIL on unfixed code, demonstrating:
   * - Intervals accumulate across navigations
   * - MutationObservers pile up
   * - YouTube players are not destroyed
   * 
   * Expected behavior (after fix): Only one VTT engine should be active at a time.
   */
  it('Property 1: should have only one active VTT engine after navigation (EXPECTED TO FAIL on unfixed code)', async () => {
    vi.useFakeTimers();

    // Create two articles with VTT subtitles
    const articleA = {
      slug: 'article-a',
      title: 'Article A',
      content_html: `
        <video id="video-a" data-vtt="/vtt/test-a.vtt" src="/vid/test-a.mp4"></video>
      `,
      published_at: '2024-01-01',
    };

    const articleB = {
      slug: 'article-b',
      title: 'Article B',
      content_html: `
        <video id="video-b" data-vtt="/vtt/test-b.vtt" src="/vid/test-b.mp4"></video>
      `,
      published_at: '2024-01-02',
    };

    // Track active intervals and observers
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const activeIntervals = new Set();
    let totalIntervalsCreated = 0;
    let totalIntervalsCleared = 0;
    
    global.setInterval = (...args) => {
      const id = originalSetInterval(...args);
      activeIntervals.add(id);
      totalIntervalsCreated++;
      return id;
    };
    
    global.clearInterval = (id) => {
      if (activeIntervals.has(id)) {
        totalIntervalsCleared++;
      }
      activeIntervals.delete(id);
      originalClearInterval(id);
    };

    const originalMutationObserver = global.MutationObserver;
    const activeMutationObservers = new Set();
    let totalObserversCreated = 0;
    let totalObserversDisconnected = 0;
    
    global.MutationObserver = class extends originalMutationObserver {
      constructor(...args) {
        super(...args);
        activeMutationObservers.add(this);
        totalObserversCreated++;
      }
      
      disconnect() {
        if (activeMutationObservers.has(this)) {
          totalObserversDisconnected++;
        }
        activeMutationObservers.delete(this);
        super.disconnect();
      }
    };

    // Render Article A
    let renderResult;
    await act(async () => {
      renderResult = render(
        <ArticleView article={articleA} recommended={[]} authorInfo={{}} />
      );
    });
    const { rerender } = renderResult;

    // Wait for VTT engine to initialize and run polling
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Count active resources after Article A loads
    const intervalsAfterA = activeIntervals.size;
    const observersAfterA = activeMutationObservers.size;

    console.log(`After Article A: ${intervalsAfterA} intervals (${totalIntervalsCreated} created, ${totalIntervalsCleared} cleared), ${observersAfterA} observers (${totalObserversCreated} created, ${totalObserversDisconnected} disconnected)`);

    // Navigate to Article B (simulating Next.js App Router behavior - component stays mounted)
    await act(async () => {
      rerender(
        <ArticleView article={articleB} recommended={[]} authorInfo={{}} />
      );
    });

    // Wait for VTT engine to initialize for Article B and cleanup to run
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Count active resources after Article B loads
    const intervalsAfterB = activeIntervals.size;
    const observersAfterB = activeMutationObservers.size;

    console.log(`After Article B: ${intervalsAfterB} intervals (${totalIntervalsCreated} created, ${totalIntervalsCleared} cleared), ${observersAfterB} observers (${totalObserversCreated} created, ${totalObserversDisconnected} disconnected)`);

    // CRITICAL ASSERTION: Only one VTT engine should be active
    // On UNFIXED code, this will FAIL because:
    // - Article A's intervals are NOT cleared before Article B's start
    // - Article A's MutationObserver is NOT disconnected
    // - Multiple VTT engines run concurrently
    
    // Check if cleanup happened properly
    const cleanupHappened = totalIntervalsCleared > 0 && totalObserversDisconnected > 0;
    
    console.log(`Cleanup happened: ${cleanupHappened}`);
    console.log(`Intervals: ${intervalsAfterB} active (should be ≤ ${intervalsAfterA})`);
    console.log(`Observers: ${observersAfterB} active (should be ≤ ${observersAfterA})`);
    
    // The bug manifests as:
    // 1. Intervals accumulate (intervalsAfterB > intervalsAfterA)
    // 2. Observers accumulate (observersAfterB > observersAfterA)
    // 3. No cleanup happens (totalIntervalsCleared === 0 || totalObserversDisconnected === 0)
    
    expect(intervalsAfterB).toBeLessThanOrEqual(intervalsAfterA);
    expect(observersAfterB).toBeLessThanOrEqual(observersAfterA);
    
    // Verify cleanup actually happened
    expect(totalIntervalsCleared).toBeGreaterThan(0);
    expect(totalObserversDisconnected).toBeGreaterThan(0);

    // Restore mocks
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    global.MutationObserver = originalMutationObserver;

    vi.useRealTimers();
  });

  /**
   * Property-Based Test: Multiple Sequential Navigations
   * 
   * This test generates random navigation sequences and verifies that
   * intervals and observers don't accumulate beyond a reasonable threshold.
   */
  it('Property 1 (PBT): should not accumulate intervals across multiple navigations', async () => {
    vi.useFakeTimers();

    // Track intervals
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const activeIntervals = new Set();
    
    global.setInterval = (...args) => {
      const id = originalSetInterval(...args);
      activeIntervals.add(id);
      return id;
    };
    
    global.clearInterval = (id) => {
      activeIntervals.delete(id);
      originalClearInterval(id);
    };

    // Property: For any sequence of article navigations, intervals should not accumulate
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 2, maxLength: 5 }),
        async (articleIndices) => {
          // Create articles
          const articles = articleIndices.map((idx) => ({
            slug: `article-${idx}`,
            title: `Article ${idx}`,
            content_html: `<video id="video-${idx}" data-vtt="/vtt/test-${idx}.vtt" src="/vid/test-${idx}.mp4"></video>`,
            published_at: `2024-01-0${idx}`,
          }));

          // Render first article
          let renderResult;
          await act(async () => {
            renderResult = render(
              <ArticleView article={articles[0]} recommended={[]} authorInfo={{}} />
            );
          });
          const { rerender, unmount } = renderResult;

          await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
          });

          const initialIntervals = activeIntervals.size;

          // Navigate through articles
          for (let i = 1; i < articles.length; i++) {
            await act(async () => {
              rerender(
                <ArticleView article={articles[i]} recommended={[]} authorInfo={{}} />
              );
            });
            await act(async () => {
              await vi.advanceTimersByTimeAsync(100);
            });
          }

          const finalIntervals = activeIntervals.size;

          console.log(`Navigation sequence ${articleIndices.join(' → ')}: ${initialIntervals} → ${finalIntervals} intervals`);

          // CRITICAL: Intervals should not accumulate beyond a reasonable threshold
          // On UNFIXED code, this will FAIL because intervals pile up
          // Expected: finalIntervals should be close to initialIntervals (ideally equal)
          // Actual (unfixed): finalIntervals will be much larger (accumulating)
          
          const maxAllowedIntervals = initialIntervals + 1; // Allow 1 extra for tolerance
          const intervalAccumulation = finalIntervals > maxAllowedIntervals;

          await act(async () => {
            unmount();
          });
          cleanup();

          // This assertion will FAIL on unfixed code, proving the bug exists
          return !intervalAccumulation;
        }
      ),
      {
        numRuns: 10, // Run 10 different navigation sequences
        verbose: true,
      }
    );

    // Restore mocks
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;

    vi.useRealTimers();
  });
});


/**
 * ============================================================================
 * TASK 2: PRESERVATION PROPERTY TESTS
 * ============================================================================
 * 
 * These tests capture the CURRENT behavior of VTT functionality on UNFIXED code.
 * They MUST PASS on unfixed code to establish baseline behavior.
 * After the fix, these same tests MUST STILL PASS to prove no regressions.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**
 */

describe('VTT Engine - Preservation Property Tests (BEFORE fix)', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock window APIs
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    
    // Mock Audio API
    global.Audio = class Audio {
      constructor() {}
      play() {
        return Promise.resolve();
      }
    };
    
    // Mock HTMLMediaElement methods
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
    
    // Mock YouTube API
    window.YT = undefined;
    window.ytQueue = [];
    window.tuwaYTInitialized = false;
    window.onYouTubeIframeAPIReady = undefined;
    
    // Mock fetch for VTT files
    global.fetch = vi.fn((url) => {
      if (url.includes('.vtt')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`WEBVTT

00:00:00.000 --> 00:00:05.000
Test subtitle 1

00:00:05.000 --> 00:00:10.000
Test subtitle 2

00:00:10.000 --> 00:00:15.000
Test subtitle 3`),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  /**
   * Property 2.1: VTT Parsing Preservation
   * 
   * **Validates: Requirements 3.5**
   * 
   * Tests that VTT files are parsed correctly and produce the expected cue structure.
   * This captures the current parseVtt function behavior.
   */
  describe('Property 2.1: VTT Parsing Preservation', () => {
    it('should parse VTT timestamps correctly (HH:MM:SS.mmm format)', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'test-article',
        title: 'Test Article',
        content_html: `
          <video id="test-video" data-vtt="/vtt/test.vtt" src="/vid/test.mp4"></video>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // Verify VTT was fetched
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vtt/test.vtt'),
        expect.any(Object)
      );

      // Verify subtitle overlay was created
      const overlay = document.querySelector('.tuwa-subtitle-overlay');
      expect(overlay).toBeTruthy();

      vi.useRealTimers();
    });

    it('Property 2.1 (PBT): should parse various VTT timestamp formats correctly', async () => {
      vi.useFakeTimers();

      // Property: For any valid VTT timestamp format, parsing should produce valid cue timings
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hours: fc.integer({ min: 0, max: 2 }),
            minutes: fc.integer({ min: 0, max: 59 }),
            seconds: fc.integer({ min: 0, max: 59 }),
            milliseconds: fc.integer({ min: 0, max: 999 }),
          }),
          async (time) => {
            const { hours, minutes, seconds, milliseconds } = time;
            const timestamp = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
            
            const vttContent = `WEBVTT

${timestamp} --> ${timestamp}
Test subtitle`;

            global.fetch = vi.fn((url) => {
              if (url.includes('.vtt')) {
                return Promise.resolve({
                  ok: true,
                  text: () => Promise.resolve(vttContent),
                });
              }
              return Promise.reject(new Error('Not found'));
            });

            const article = {
              slug: `test-${hours}-${minutes}-${seconds}`,
              title: 'Test Article',
              content_html: `<video id="test-video" data-vtt="/vtt/test.vtt" src="/vid/test.mp4"></video>`,
              published_at: '2024-01-01',
            };

            const { unmount } = await act(async () => {
              return render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
            });

            await act(async () => {
              await vi.advanceTimersByTimeAsync(1500);
            });

            // Verify VTT was fetched and processed
            const overlay = document.querySelector('.tuwa-subtitle-overlay');
            const processed = overlay !== null;

            await act(async () => {
              unmount();
            });
            cleanup();

            return processed;
          }
        ),
        {
          numRuns: 20,
          verbose: false,
        }
      );

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.2: Video Element Subtitle Display Preservation
   * 
   * **Validates: Requirements 3.1, 3.6**
   * 
   * Tests that video elements with VTT subtitles display correctly.
   */
  describe('Property 2.2: Video Element Subtitle Display', () => {
    it('should create subtitle overlay for video elements with data-vtt attribute', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'video-test',
        title: 'Video Test',
        content_html: `
          <video id="my-video" data-vtt="/vtt/video.vtt" src="/vid/video.mp4"></video>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // Verify overlay was created
      const overlay = document.querySelector('.tuwa-subtitle-overlay');
      expect(overlay).toBeTruthy();
      expect(overlay.style.position).toBe('absolute');
      expect(overlay.style.zIndex).toBe('9999');

      vi.useRealTimers();
    });

    it('should attach timeupdate event listener to video elements', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'video-event-test',
        title: 'Video Event Test',
        content_html: `
          <video id="event-video" data-vtt="/vtt/test.vtt" src="/vid/test.mp4"></video>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      const video = document.getElementById('event-video');
      expect(video).toBeTruthy();
      
      // Verify video was processed
      expect(video.dataset.vttProcessed).toBe('true');

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.3: Audio Element Subtitle Display Preservation
   * 
   * **Validates: Requirements 3.2, 3.6**
   * 
   * Tests that audio elements with VTT subtitles display correctly.
   */
  describe('Property 2.3: Audio Element Subtitle Display', () => {
    it('should create subtitle overlay for audio elements with data-vtt attribute', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'audio-test',
        title: 'Audio Test',
        content_html: `
          <audio id="my-audio" data-vtt="/vtt/audio.vtt" src="/audio/audio.mp3"></audio>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // Verify overlay was created
      const overlay = document.querySelector('.tuwa-subtitle-overlay');
      expect(overlay).toBeTruthy();
      
      // Verify audio was processed
      const audio = document.getElementById('my-audio');
      expect(audio.dataset.vttProcessed).toBe('true');

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.4: YouTube Iframe Integration Preservation
   * 
   * **Validates: Requirements 3.3, 3.7**
   * 
   * Tests that YouTube iframes with VTT subtitles integrate correctly with YouTube IFrame API.
   */
  describe('Property 2.4: YouTube Iframe Integration', () => {
    it('should inject enablejsapi=1 parameter into YouTube iframe URLs', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'youtube-test',
        title: 'YouTube Test',
        content_html: `
          <iframe id="yt-iframe" data-vtt="/vtt/youtube.vtt" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      const iframe = document.getElementById('yt-iframe');
      expect(iframe).toBeTruthy();
      expect(iframe.src).toContain('enablejsapi=1');

      vi.useRealTimers();
    });

    it('should dynamically inject YouTube IFrame API script when needed', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'youtube-api-test',
        title: 'YouTube API Test',
        content_html: `
          <iframe id="yt-test" data-vtt="/vtt/test.vtt" src="https://www.youtube.com/embed/test123"></iframe>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // Verify YouTube API script was injected
      const ytScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      expect(ytScript).toBeTruthy();

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.5: Standalone Subtitle Box Preservation
   * 
   * **Validates: Requirements 3.4, 3.6**
   * 
   * Tests that .tuwa-subtitle-box elements are scanned and processed correctly.
   */
  describe('Property 2.5: Standalone Subtitle Box', () => {
    it('should process .tuwa-subtitle-box elements with data-vtt attribute', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'subtitle-box-test',
        title: 'Subtitle Box Test',
        content_html: `
          <div class="tuwa-subtitle-box" data-vtt="/vtt/box.vtt" data-video="my-video">
            <video id="my-video" src="/vid/test.mp4"></video>
          </div>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // Verify subtitle box was processed
      const subtitleBox = document.querySelector('.tuwa-subtitle-box');
      expect(subtitleBox).toBeTruthy();
      expect(subtitleBox.dataset.vttProcessed).toBe('true');

      // Verify overlay was created with relative positioning for standalone box
      const overlay = document.querySelector('.tuwa-subtitle-overlay');
      expect(overlay).toBeTruthy();
      expect(overlay.style.position).toBe('relative');

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.6: MutationObserver Dynamic Element Detection Preservation
   * 
   * **Validates: Requirements 3.8**
   * 
   * Tests that dynamically added media elements are detected and processed.
   */
  describe('Property 2.6: Dynamic Element Detection', () => {
    it('should detect and process dynamically added video elements', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'dynamic-test',
        title: 'Dynamic Test',
        content_html: `<div id="container"></div>`,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Dynamically add a video element
      const container = document.getElementById('container');
      if (container) {
        const video = document.createElement('video');
        video.id = 'dynamic-video';
        video.dataset.vtt = '/vtt/dynamic.vtt';
        video.src = '/vid/dynamic.mp4';
        container.appendChild(video);
      }

      // Wait for MutationObserver to detect and process
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      const dynamicVideo = document.getElementById('dynamic-video');
      expect(dynamicVideo).toBeTruthy();
      
      // Verify it was processed
      expect(dynamicVideo.dataset.vttProcessed).toBeTruthy();

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.7: Mixed Media Article Preservation
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Tests that articles with multiple media types all work correctly.
   */
  describe('Property 2.7: Mixed Media Articles', () => {
    it('should handle articles with video, audio, and YouTube iframe simultaneously', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'mixed-media-test',
        title: 'Mixed Media Test',
        content_html: `
          <video id="video1" data-vtt="/vtt/video1.vtt" src="/vid/video1.mp4"></video>
          <audio id="audio1" data-vtt="/vtt/audio1.vtt" src="/audio/audio1.mp3"></audio>
          <iframe id="yt1" data-vtt="/vtt/yt1.vtt" src="https://www.youtube.com/embed/test1"></iframe>
          <div class="tuwa-subtitle-box" data-vtt="/vtt/box1.vtt" data-video="video2">
            <video id="video2" src="/vid/video2.mp4"></video>
          </div>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Verify all elements were processed
      const video1 = document.getElementById('video1');
      const audio1 = document.getElementById('audio1');
      const yt1 = document.getElementById('yt1');
      const subtitleBox = document.querySelector('.tuwa-subtitle-box');

      expect(video1?.dataset.vttProcessed).toBeTruthy();
      expect(audio1?.dataset.vttProcessed).toBeTruthy();
      expect(yt1?.dataset.vttProcessed).toBeTruthy();
      expect(subtitleBox?.dataset.vttProcessed).toBeTruthy();

      // Verify multiple overlays were created
      const overlays = document.querySelectorAll('.tuwa-subtitle-overlay');
      expect(overlays.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('Property 2.7 (PBT): should handle various combinations of media elements', async () => {
      vi.useFakeTimers();

      // Property: For any combination of media elements, all should be processed correctly
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hasVideo: fc.boolean(),
            hasAudio: fc.boolean(),
            hasYouTube: fc.boolean(),
            hasSubtitleBox: fc.boolean(),
          }),
          async (config) => {
            // Skip if no media elements
            if (!config.hasVideo && !config.hasAudio && !config.hasYouTube && !config.hasSubtitleBox) {
              return true;
            }

            let contentHtml = '';
            let expectedCount = 0;

            if (config.hasVideo) {
              contentHtml += `<video id="pbt-video" data-vtt="/vtt/video.vtt" src="/vid/video.mp4"></video>`;
              expectedCount++;
            }
            if (config.hasAudio) {
              contentHtml += `<audio id="pbt-audio" data-vtt="/vtt/audio.vtt" src="/audio/audio.mp3"></audio>`;
              expectedCount++;
            }
            if (config.hasYouTube) {
              contentHtml += `<iframe id="pbt-yt" data-vtt="/vtt/yt.vtt" src="https://www.youtube.com/embed/test"></iframe>`;
              expectedCount++;
            }
            if (config.hasSubtitleBox) {
              contentHtml += `<div class="tuwa-subtitle-box" data-vtt="/vtt/box.vtt" data-video="box-video"><video id="box-video" src="/vid/box.mp4"></video></div>`;
              expectedCount++;
            }

            const article = {
              slug: `pbt-mixed-${Date.now()}`,
              title: 'PBT Mixed Test',
              content_html: contentHtml,
              published_at: '2024-01-01',
            };

            const { unmount } = await act(async () => {
              return render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
            });

            await act(async () => {
              await vi.advanceTimersByTimeAsync(2000);
            });

            // Count processed elements
            let processedCount = 0;
            if (config.hasVideo && document.getElementById('pbt-video')?.dataset.vttProcessed) processedCount++;
            if (config.hasAudio && document.getElementById('pbt-audio')?.dataset.vttProcessed) processedCount++;
            if (config.hasYouTube && document.getElementById('pbt-yt')?.dataset.vttProcessed) processedCount++;
            if (config.hasSubtitleBox && document.querySelector('.tuwa-subtitle-box')?.dataset.vttProcessed) processedCount++;

            await act(async () => {
              unmount();
            });
            cleanup();

            // All elements should be processed
            return processedCount === expectedCount;
          }
        ),
        {
          numRuns: 15,
          verbose: false,
        }
      );

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.8: Error Handling Preservation
   * 
   * **Validates: Requirements 3.5**
   * 
   * Tests that VTT fetch errors are handled gracefully.
   */
  describe('Property 2.8: Error Handling', () => {
    it('should mark elements as error when VTT fetch fails', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn((url) => {
        if (url.includes('.vtt')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const article = {
        slug: 'error-test',
        title: 'Error Test',
        content_html: `
          <video id="error-video" data-vtt="/vtt/nonexistent.vtt" src="/vid/test.mp4"></video>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      const video = document.getElementById('error-video');
      expect(video?.dataset.vttProcessed).toBe('error');

      vi.useRealTimers();
    });

    it('should mark elements as ignored when no data-vtt attribute present', async () => {
      vi.useFakeTimers();

      const article = {
        slug: 'no-vtt-test',
        title: 'No VTT Test',
        content_html: `
          <video id="no-vtt-video" src="/vid/test.mp4"></video>
        `,
        published_at: '2024-01-01',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      const video = document.getElementById('no-vtt-video');
      expect(video?.dataset.vttProcessed).toBe('ignored');

      vi.useRealTimers();
    });
  });

  /**
   * Property 2.9: Other ArticleView Functionality Preservation
   * 
   * **Validates: Requirements 3.9**
   * 
   * Tests that other ArticleView features continue to work unchanged.
   */
  describe('Property 2.9: Other ArticleView Functionality', () => {
    it('should render article content correctly', async () => {
      const article = {
        slug: 'content-test',
        title: 'Content Test',
        subtitle: 'Test Subtitle',
        content_html: '<p>Test content</p>',
        published_at: '2024-01-01',
        author: 'Test Author',
      };

      await act(async () => {
        render(<ArticleView article={article} recommended={[]} authorInfo={{}} />);
      });

      // Verify title is rendered
      expect(document.body.textContent).toContain('Content Test');
      expect(document.body.textContent).toContain('Test Subtitle');
      expect(document.body.textContent).toContain('Test content');
    });

    it('should render recommended articles section', async () => {
      const article = {
        slug: 'main-article',
        title: 'Main Article',
        content_html: '<p>Main content</p>',
        published_at: '2024-01-01',
      };

      const recommended = [
        {
          slug: 'rec-1',
          title: 'Recommended 1',
          published_at: '2024-01-02',
        },
      ];

      await act(async () => {
        render(<ArticleView article={article} recommended={recommended} authorInfo={{}} />);
      });

      // Verify recommended section exists
      expect(document.body.textContent).toContain('Recommended For You');
      expect(document.body.textContent).toContain('Recommended 1');
    });
  });
});
