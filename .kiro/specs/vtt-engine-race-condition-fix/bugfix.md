# Bugfix Requirements Document

## Introduction

This document specifies the requirements for fixing a race condition bug in `ArticleView.jsx` where navigating between articles causes DOM intervals and VTT subtitle processing to pile up. The bug manifests in a "1 article works, 2 fail, 1 works" alternating pattern due to multiple concurrent subtitle engines running simultaneously.

In Next.js App Router, navigating between articles only changes the `slug` prop while keeping the `ArticleView` component mounted. This causes the massive useEffect that handles VTT subtitle injection to run multiple times without properly cleaning up previous instances, resulting in:
- DOM intervals piling up across navigations
- VTT subtitle processing getting duplicated
- Media elements (video, audio, YouTube iframes) accumulating stale event listeners
- Race conditions where multiple subtitle engines conflict with each other

The root cause is that the VTT/subtitle logic in the useEffect doesn't properly isolate itself per article navigation, allowing multiple instances to run concurrently.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN navigating from Article A to Article B THEN multiple VTT subtitle engines run simultaneously, causing subtitle conflicts and DOM manipulation race conditions

1.2 WHEN navigating between articles in sequence (A → B → C) THEN DOM intervals accumulate without cleanup, resulting in an alternating success/failure pattern where the 1st article works, 2nd fails, 3rd works, etc.

1.3 WHEN the VTT useEffect runs on slug change THEN previous instances' intervals, event listeners, and MutationObservers are not fully cleaned up before new ones are created

1.4 WHEN YouTube iframe players are initialized during navigation THEN previous player instances are not destroyed, causing memory leaks and conflicting time polling intervals

1.5 WHEN VTT fetch requests are in-flight during navigation THEN they are not aborted, causing stale responses to process against the wrong article's DOM

### Expected Behavior (Correct)

2.1 WHEN navigating from Article A to Article B THEN the VTT subtitle engine for Article A SHALL be completely unmounted and destroyed before Article B's engine initializes

2.2 WHEN navigating between articles in sequence (A → B → C) THEN each article SHALL have exactly one isolated VTT subtitle engine instance with no interference from previous articles

2.3 WHEN the slug changes THEN all intervals, event listeners, MutationObservers, AbortControllers, and YouTube player instances from the previous article SHALL be cleaned up before new ones are created

2.4 WHEN YouTube iframe players are initialized THEN previous player instances SHALL be destroyed using the YouTube IFrame API's destroy() method

2.5 WHEN VTT fetch requests are in-flight during navigation THEN they SHALL be aborted using AbortController to prevent stale responses from processing

2.6 WHEN the VTT engine is extracted into a separate component THEN it SHALL be mounted with `key={slug}` to force React to completely unmount/remount the engine on every navigation

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an article contains video elements with VTT subtitles THEN the system SHALL CONTINUE TO parse and display subtitles synchronized with video playback

3.2 WHEN an article contains audio elements with VTT subtitles THEN the system SHALL CONTINUE TO parse and display subtitles synchronized with audio playback

3.3 WHEN an article contains YouTube iframe embeds with VTT subtitles THEN the system SHALL CONTINUE TO integrate with the YouTube IFrame API and display synchronized subtitles

3.4 WHEN an article contains `.tuwa-subtitle-box` elements THEN the system SHALL CONTINUE TO scan for and process these elements for subtitle injection

3.5 WHEN VTT files are fetched THEN the system SHALL CONTINUE TO parse them correctly and extract cue timings and text

3.6 WHEN subtitle overlays are created THEN the system SHALL CONTINUE TO position them correctly (absolute positioning for media elements, relative for standalone boxes)

3.7 WHEN the YouTube IFrame API script is not loaded THEN the system SHALL CONTINUE TO dynamically inject it and queue player initialization

3.8 WHEN media elements are dynamically added to the article DOM THEN the system SHALL CONTINUE TO detect them via MutationObserver and process their subtitles

3.9 WHEN ArticleView renders THEN all other functionality (scroll tracking, recommendations, subscription form, header behavior) SHALL CONTINUE TO work unchanged
