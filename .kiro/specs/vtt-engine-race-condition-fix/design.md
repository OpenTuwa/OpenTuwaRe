# VTT Engine Race Condition Fix - Bugfix Design

## Overview

This bugfix extracts the VTT subtitle processing logic from `ArticleView.jsx` into a separate `VttEngine.jsx` component to eliminate race conditions caused by multiple concurrent subtitle engines running during article navigation. The fix leverages React's component lifecycle by mounting VttEngine with `key={slug}`, forcing complete unmount/remount on every navigation and ensuring proper cleanup of intervals, event listeners, and YouTube player instances.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when navigating between articles causes multiple VTT subtitle engines to run simultaneously
- **Property (P)**: The desired behavior - each article has exactly one isolated VTT subtitle engine with complete cleanup on navigation
- **Preservation**: Existing VTT subtitle functionality (parsing, display, synchronization) that must remain unchanged
- **VttEngine**: The new component in `src/components/VttEngine.jsx` that encapsulates all VTT subtitle processing logic
- **articleRef**: A React ref passed from ArticleView to VttEngine that points to the article DOM container
- **isActive**: A boolean flag that tracks whether the current VTT engine instance is still mounted
- **inFlightElements**: A WeakSet that tracks elements currently being processed to prevent duplicate processing
- **AbortController**: Browser API used to cancel in-flight fetch requests when the component unmounts

## Bug Details

### Bug Condition

The bug manifests when navigating between articles in Next.js App Router. The `ArticleView` component remains mounted while only the `slug` prop changes, causing the massive VTT useEffect to run multiple times without properly cleaning up previous instances.

**Formal Specification:**
```
FUNCTION isBugCondition(navigation)
  INPUT: navigation of type ArticleNavigation
  OUTPUT: boolean
  
  RETURN navigation.fromArticle != null
         AND navigation.toArticle != null
         AND ArticleView.isMounted == true
         AND previousVttEngine.isActive == true
         AND newVttEngine.isActive == true
END FUNCTION
```

### Examples

- **Example 1**: Navigate from Article A to Article B → Both VTT engines run simultaneously, causing subtitle conflicts where subtitles from Article A appear on Article B's media elements
- **Example 2**: Navigate A → B → C → D → E → Intervals accumulate (5 polling intervals, 5 MutationObservers, 5 YouTube API polling loops), causing performance degradation and memory leaks
- **Example 3**: Navigate from Article A to Article B while Article A's VTT fetch is in-flight → Article A's VTT response processes against Article B's DOM, injecting wrong subtitles
- **Edge Case**: Navigate rapidly between 10 articles → 10 concurrent VTT engines run, each with its own intervals and event listeners, causing browser slowdown and eventual crash

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- VTT file parsing must continue to work exactly as before (parseVtt function logic unchanged)
- Subtitle overlay creation and positioning must remain unchanged (createOverlay function logic unchanged)
- Media element scanning (video, audio, iframe, .tuwa-subtitle-box) must continue to work
- YouTube IFrame API integration must continue to work with enablejsapi parameter injection
- MutationObserver-based dynamic element detection must continue to work
- Subtitle synchronization with media playback must remain unchanged
- Standalone subtitle boxes (.tuwa-subtitle-box) must continue to work

**Scope:**
All VTT subtitle functionality that does NOT involve component lifecycle management should be completely unaffected by this fix. This includes:
- VTT time parsing logic
- Cue text extraction and formatting
- Overlay styling and positioning
- Event listener attachment for timeupdate events
- YouTube player time polling

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Component Lifecycle Mismatch**: Next.js App Router keeps `ArticleView` mounted during navigation, only changing the `slug` prop. The VTT useEffect depends on `slug`, so it runs on every navigation, but React doesn't automatically clean up the previous instance's side effects before starting the new one.

2. **Insufficient Cleanup Isolation**: The current cleanup function in the useEffect tries to clean up by querying the DOM, but by the time cleanup runs, the DOM may have already been updated with the new article's content, causing cleanup to miss stale elements.

3. **Shared Global State**: The YouTube IFrame API initialization uses global state (`window.tuwaYTInitialized`, `window.ytQueue`, `window.onYouTubeIframeAPIReady`), which is shared across all VTT engine instances, causing conflicts.

4. **DOM Flag Race Conditions**: The `data-vtt-processed` attribute is used to prevent duplicate processing, but when multiple engines run concurrently, they can both read the flag as "not processed" before either sets it, causing duplicate processing.

## Correctness Properties

Property 1: Bug Condition - Single VTT Engine Per Article

_For any_ navigation from Article A to Article B, the VTT engine for Article A SHALL be completely unmounted and destroyed (all intervals cleared, all event listeners removed, all YouTube players destroyed, all fetch requests aborted) before Article B's VTT engine initializes.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - VTT Functionality Unchanged

_For any_ article with VTT subtitles (video, audio, YouTube iframe, or standalone subtitle box), the VttEngine component SHALL parse, display, and synchronize subtitles exactly as the original ArticleView implementation did, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

**File**: `src/components/VttEngine.jsx` (NEW FILE)

**Purpose**: Encapsulate all VTT subtitle processing logic in an isolated component

**Specific Changes**:

1. **Create VttEngine Component**: Extract the entire VTT useEffect logic from ArticleView.jsx into a new component
   - Accept `articleRef` as a prop (React ref pointing to the article DOM container)
   - Accept `slug` as a prop (used for debugging/logging only, not for logic)
   - Return `null` (this is a logic-only component with no visual output)

2. **Preserve All VTT Logic**: Copy the following functions unchanged from ArticleView.jsx:
   - `parseVttTime(timeStr)` - converts VTT timestamp strings to seconds
   - `parseVtt(vttText)` - parses VTT file content into cue objects
   - `createOverlay(container, isStandaloneBox)` - creates subtitle overlay DOM elements
   - `attachSubtitleUpdater(overlay, cues, mediaEl, cleanupFns)` - attaches time synchronization logic
   - `initSingleSubtitle(targetEl)` - processes a single media element
   - `scanAndInit()` - scans the article DOM for media elements

3. **Maintain Concurrency Guards**: Keep all existing race condition fixes:
   - `AbortController` for fetch cancellation
   - `isActive` flag for early returns
   - `inFlightElements` WeakSet for duplicate processing prevention
   - `articleEl.isConnected` check before DOM operations

4. **Preserve Cleanup Logic**: Keep the cleanup function that:
   - Sets `isActive = false`
   - Aborts all fetch requests
   - Disconnects MutationObserver
   - Removes all event listeners
   - Destroys YouTube player instances
   - Clears all intervals
   - Removes `data-vtt-processed` attributes
   - Removes subtitle overlays

5. **YouTube API Integration**: Keep the global YouTube API initialization logic:
   - `window.tuwaYTInitialized` flag
   - `window.ytQueue` array
   - `window.onYouTubeIframeAPIReady` callback
   - Dynamic script injection for YouTube IFrame API

**File**: `src/components/ArticleView.jsx` (MODIFIED)

**Function**: `ArticleView` component

**Specific Changes**:

1. **Remove VTT useEffect**: Delete the entire massive useEffect that handles VTT subtitle processing (lines ~120-450)

2. **Import VttEngine**: Add `import VttEngine from './VttEngine';` at the top

3. **Mount VttEngine with key**: In the JSX, after the `<article>` element, add:
   ```jsx
   <VttEngine key={slug} articleRef={articleRef} slug={slug} />
   ```
   The `key={slug}` is CRITICAL - it forces React to completely unmount the old VttEngine and mount a new one on every navigation

4. **Keep articleRef**: The existing `articleRef` ref must remain unchanged, as it's now passed to VttEngine

5. **Preserve All Other Logic**: All other ArticleView functionality (scroll tracking, recommendations, subscription form, header behavior) remains completely unchanged

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that simulate rapid navigation between articles and assert that only one VTT engine instance is active at a time. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Concurrent Engine Test**: Navigate A → B, assert that Article A's intervals are cleared before Article B's start (will fail on unfixed code)
2. **Interval Accumulation Test**: Navigate A → B → C → D → E, count active intervals, assert count equals 1 (will fail on unfixed code, count will be 5)
3. **Fetch Abort Test**: Navigate A → B while Article A's VTT fetch is in-flight, assert fetch is aborted (will fail on unfixed code)
4. **YouTube Player Cleanup Test**: Navigate from article with YouTube iframe to another article, assert previous player is destroyed (will fail on unfixed code)

**Expected Counterexamples**:
- Multiple VTT engines run simultaneously with overlapping intervals
- Possible causes: useEffect cleanup runs too late, component remains mounted, no isolation between instances

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL navigation WHERE isBugCondition(navigation) DO
  result := navigateWithVttEngine(navigation)
  ASSERT result.activeEngineCount == 1
  ASSERT result.previousEngineCleanedUp == true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL article WHERE article.hasVttSubtitles == true DO
  ASSERT VttEngine.parseVtt(article.vttFile) == ArticleView.parseVtt(article.vttFile)
  ASSERT VttEngine.subtitleDisplay == ArticleView.subtitleDisplay
  ASSERT VttEngine.synchronization == ArticleView.synchronization
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different article configurations
- It catches edge cases like missing VTT files, malformed timestamps, or unusual media element structures
- It provides strong guarantees that subtitle functionality is unchanged for all article types

**Test Plan**: Observe behavior on UNFIXED code first for various article types (video-only, audio-only, YouTube iframe, standalone subtitle box, mixed media), then write property-based tests capturing that behavior.

**Test Cases**:
1. **VTT Parsing Preservation**: Generate random VTT files, verify parsing produces identical results
2. **Subtitle Display Preservation**: Generate random article DOMs with media elements, verify subtitles display identically
3. **Synchronization Preservation**: Generate random media playback scenarios, verify subtitle timing is identical
4. **YouTube Integration Preservation**: Generate random YouTube iframe configurations, verify API integration works identically

### Unit Tests

- Test VttEngine mounts and unmounts correctly with key={slug}
- Test AbortController cancels fetch requests on unmount
- Test isActive flag prevents operations after unmount
- Test inFlightElements prevents duplicate processing
- Test YouTube player destroy() is called on unmount
- Test MutationObserver disconnect() is called on unmount
- Test all intervals are cleared on unmount

### Property-Based Tests

- Generate random navigation sequences (A → B → C → ...) and verify only one engine is active at any time
- Generate random article DOMs with various media element configurations and verify subtitles work correctly
- Generate random VTT files with edge cases (empty cues, malformed timestamps, special characters) and verify parsing is robust
- Generate random timing scenarios (rapid navigation, slow navigation, navigation during fetch) and verify cleanup always happens

### Integration Tests

- Test full navigation flow: load Article A with video, wait for subtitles to appear, navigate to Article B with audio, verify Article A's engine is destroyed and Article B's subtitles work
- Test YouTube integration: load article with YouTube iframe, wait for player initialization, navigate away, verify player is destroyed
- Test rapid navigation: navigate through 10 articles quickly, verify no memory leaks or performance degradation
- Test mixed media: load article with video, audio, YouTube iframe, and standalone subtitle box all at once, verify all subtitles work correctly
