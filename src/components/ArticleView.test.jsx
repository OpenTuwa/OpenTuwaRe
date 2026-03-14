/**
 * Bug Condition Exploration Test for VTT Engine Race Condition
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * The test encodes the expected behavior - it will validate the fix when it passes after implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
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
    const { rerender } = render(
      <ArticleView article={articleA} recommended={[]} authorInfo={{}} />
    );

    // Wait for VTT engine to initialize and run polling
    await vi.advanceTimersByTimeAsync(2000);

    // Count active resources after Article A loads
    const intervalsAfterA = activeIntervals.size;
    const observersAfterA = activeMutationObservers.size;

    console.log(`After Article A: ${intervalsAfterA} intervals (${totalIntervalsCreated} created, ${totalIntervalsCleared} cleared), ${observersAfterA} observers (${totalObserversCreated} created, ${totalObserversDisconnected} disconnected)`);

    // Navigate to Article B (simulating Next.js App Router behavior - component stays mounted)
    rerender(
      <ArticleView article={articleB} recommended={[]} authorInfo={{}} />
    );

    // Wait for VTT engine to initialize for Article B and cleanup to run
    await vi.advanceTimersByTimeAsync(2000);

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
          const { rerender, unmount } = render(
            <ArticleView article={articles[0]} recommended={[]} authorInfo={{}} />
          );

          await vi.advanceTimersByTimeAsync(100);

          const initialIntervals = activeIntervals.size;

          // Navigate through articles
          for (let i = 1; i < articles.length; i++) {
            rerender(
              <ArticleView article={articles[i]} recommended={[]} authorInfo={{}} />
            );
            await vi.advanceTimersByTimeAsync(100);
          }

          const finalIntervals = activeIntervals.size;

          console.log(`Navigation sequence ${articleIndices.join(' → ')}: ${initialIntervals} → ${finalIntervals} intervals`);

          // CRITICAL: Intervals should not accumulate beyond a reasonable threshold
          // On UNFIXED code, this will FAIL because intervals pile up
          // Expected: finalIntervals should be close to initialIntervals (ideally equal)
          // Actual (unfixed): finalIntervals will be much larger (accumulating)
          
          const maxAllowedIntervals = initialIntervals + 1; // Allow 1 extra for tolerance
          const intervalAccumulation = finalIntervals > maxAllowedIntervals;

          unmount();
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
