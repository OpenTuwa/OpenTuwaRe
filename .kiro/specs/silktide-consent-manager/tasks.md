# Implementation Plan: Silktide Consent Manager

## Overview

Replace Cookiebot with a self-hosted Silktide Consent Manager. The work touches six files:
`functions/_utils/head.js`, `src/app/layout.jsx`, `public/_headers`, `functions/robots.txt.js`,
and two new static assets under `public/legal/`. Property-based tests cover the seven correctness
properties from the design document.

## Tasks

- [x] 1. Copy Silktide static assets into `public/legal/`
  - Place the user-supplied Silktide JS file at `public/legal/cookieconsent.js`
  - Place the user-supplied Silktide CSS file at `public/legal/cookieconsent.css`
  - These are committed as-is; no build step required
  - _Requirements: 2.1, 2.2_

- [x] 2. Update `public/_headers` — cache rule and CSP
  - [x] 2.1 Add `/legal/*` cache rule
    - Insert a `/legal/*` block with `Cache-Control: public, max-age=31536000, immutable` and `X-Content-Type-Options: nosniff`
    - Place it alongside the other static-asset cache blocks (`/assets/*`, `/img/*`)
    - _Requirements: 2.3_
  - [x] 2.2 Update the global `/*` Content-Security-Policy
    - Remove `https://consent.cookiebot.com` and `https://consentcdn.cookiebot.com` from `script-src`
    - Remove `https://consent.cookiebot.com` from `frame-src`
    - Add `https://www.googletagmanager.com` to `script-src` (keep `'self'` and `'unsafe-inline'`)
    - Resulting `script-src` must be: `'self' 'unsafe-inline' https://www.googletagmanager.com`
    - Resulting `frame-src` must not contain any `cookiebot.com` entry
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 2.3 Write property test for CSP header (Property 7)
    - **Property 7: CSP excludes Cookiebot and includes required sources**
    - Parse the raw `_headers` file, extract the CSP value, assert no `cookiebot.com`, assert `'self'` in `script-src`, assert `googletagmanager.com` in `script-src`
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 3. Update `functions/_utils/head.js` — remove Cookiebot from bot-SSR
  - [x] 3.1 Remove the `COOKIEBOT_ID` constant and the `<script id="Cookiebot">` tag
    - Delete the `const COOKIEBOT_ID = ...` line
    - Remove the `<script id="Cookiebot" src="https://consent.cookiebot.com/...">` line from the `buildHead()` return template
    - No consent scripts of any kind should appear in the returned HTML string
    - All other `buildHead()` output and the function signature remain unchanged
    - _Requirements: 1.1, 7.1, 7.2, 7.3_
  - [ ]* 3.2 Write property test for bot-SSR head (Property 1)
    - **Property 1: Bot-SSR head contains no consent scripts**
    - Generate random valid `buildHead()` option objects with fast-check, call `buildHead()`, assert output contains no `cookiebot`, no `/legal/cookieconsent`, no `gtag('consent'`
    - **Validates: Requirements 1.1, 7.1, 7.2, 8.7**
  - [ ]* 3.3 Write property test for non-bot head (Property 2)
    - **Property 2: Non-bot head contains no Cookiebot references**
    - This property is validated against `layout.jsx` output; assert the rendered head contains no `cookiebot.com` reference
    - **Validates: Requirements 1.1, 1.3**

- [x] 4. Update `src/app/layout.jsx` — wire in GCM v2 defaults and Silktide
  - [x] 4.1 Add inline GCM v2 default script (`beforeInteractive`)
    - Replace the existing Cookiebot `<Script>` tag with a `<Script id="gcm-default" strategy="beforeInteractive">` block
    - Script body must initialise `window.dataLayer`, define `gtag`, and call `gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 })`
    - This script must appear before the GTM script in `<head>` order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 4.2 Write property test for GCM default script content (Property 3)
    - **Property 3: GCM default script sets all required denied defaults**
    - Extract the inline script string, assert it contains all five required fields with correct values
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**
  - [ ]* 4.3 Write property test for GCM script ordering (Property 4)
    - **Property 4: GCM default script precedes GTM script in head**
    - Assert `indexOf(gcmScript) < indexOf(gtmScript)` in the rendered head
    - **Validates: Requirements 3.1**
  - [x] 4.4 Add Silktide CSS `<link>` and JS `<Script>` tags
    - Add `<link rel="stylesheet" href="/legal/cookieconsent.css">` inside `<head>`
    - Add `<Script src="/legal/cookieconsent.js" strategy="afterInteractive">` (Next.js `strategy="afterInteractive"` emits `defer`)
    - _Requirements: 2.1, 2.2, 2.4, 8.2_
  - [ ]* 4.5 Write property test for Silktide script defer attribute (Property 5)
    - **Property 5: Silktide script carries defer attribute**
    - Assert the rendered `<script>` tag for `/legal/cookieconsent.js` carries the `defer` attribute
    - **Validates: Requirements 2.4, 8.2**
  - [x] 4.6 Add Silktide configuration inline script
    - Add a `<Script id="silktide-config" strategy="afterInteractive">` block after the Silktide JS tag
    - Configure `CookieConsent.run({ categories: { necessary, analytics, marketing }, onConsent, onChange })`
    - `onConsent` and `onChange` must call `gtag('consent', 'update', {...})` mapping `analytics` → `analytics_storage` and `marketing` → `ad_storage`, `ad_user_data`, `ad_personalization`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3_
  - [ ]* 4.7 Write property test for consent state round-trip (Property 6)
    - **Property 6: Consent state round-trip**
    - Generate random consent cookie payloads with valid category arrays, simulate Silktide init with cookie present, assert GCM update is pushed with matching consent values
    - **Validates: Requirements 4.5**

- [ ] 5. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `functions/robots.txt.js` — allow Silktide crawler
  - Append a `User-agent: Silktide` block with `Allow: /` to the robots.txt string
  - Place it alongside the other named bot blocks (GPTBot, Google-Extended, etc.)
  - _Requirements: 8.6, 8.7_

- [ ] 7. Final checkpoint — verify end-to-end correctness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already available or add as a dev dependency)
- Each property test is tagged with `// Feature: silktide-consent-manager, Property N: <title>`
- The Silktide JS/CSS source files must be supplied by the user before task 1 can be completed
- `strategy="afterInteractive"` in Next.js emits a `defer`-equivalent loading behaviour; the rendered `<script>` tag will carry `defer`
