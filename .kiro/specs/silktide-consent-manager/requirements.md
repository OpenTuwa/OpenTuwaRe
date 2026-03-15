# Requirements Document

## Introduction

This feature replaces the existing Cookiebot integration with a self-hosted Silktide Consent Manager. The Cookiebot CDN link is discontinued and the abandoned S3 bucket has been hijacked to serve malware, making removal urgent. The new solution self-hosts the Silktide JS and CSS assets, integrates with Google Consent Mode v2 via Google Tag Manager, and ensures GDPR-compliant consent signalling before any analytics or marketing scripts execute.

The site is a Next.js app deployed on Cloudflare Pages. Consent logic must work in both the Next.js SPA path (real users) and the Cloudflare Worker bot-SSR path (`functions/_utils/head.js`).

## Glossary

- **Consent_Manager**: The self-hosted Silktide Consent Manager JavaScript library
- **Consent_Banner**: The UI overlay rendered by the Consent_Manager to collect user consent
- **GTM**: Google Tag Manager — the tag container loaded after consent defaults are set
- **GCM**: Google Consent Mode v2 — the `gtag('consent', ...)` API used to signal consent state to Google
- **Analytics_Consent**: User consent for analytics cookies (maps to GCM `analytics_storage`)
- **Marketing_Consent**: User consent for marketing/advertising cookies (maps to GCM `ad_storage` and `ad_user_data`)
- **Consent_Default**: The initial denied state pushed to `window.dataLayer` before GTM loads
- **Consent_Update**: The updated state pushed to `window.dataLayer` after the user accepts or rejects
- **Bot_SSR**: The Cloudflare Worker server-side rendering path used for search engine crawlers
- **CSP**: Content Security Policy HTTP header controlling which scripts may execute
- **CLS**: Cumulative Layout Shift — a Core Web Vitals metric measuring unexpected layout movement
- **LCP**: Largest Contentful Paint — a Core Web Vitals metric measuring perceived load speed
- **INP**: Interaction to Next Paint — a Core Web Vitals metric measuring responsiveness to user input
- **CWV**: Core Web Vitals — Google's set of real-world performance signals used as ranking factors
- **Silktide_Crawler**: The Silktide cookie auditor bot that scans the site to catalogue cookies

## Requirements

### Requirement 1: Remove Cookiebot

**User Story:** As a site operator, I want to remove all Cookiebot references, so that the site no longer loads scripts from a compromised CDN endpoint.

#### Acceptance Criteria

1. THE Consent_Manager SHALL replace the Cookiebot `<script>` tag in `functions/_utils/head.js`
2. THE Consent_Manager SHALL replace any Cookiebot references in the Next.js app layout or components
3. WHEN the site is deployed, THE Consent_Manager SHALL ensure no HTTP requests are made to `consent.cookiebot.com` or `consentcdn.cookiebot.com`
4. THE Consent_Manager SHALL update the `Content-Security-Policy` header in `public/_headers` to remove Cookiebot domains from `script-src` and `frame-src`

---

### Requirement 2: Self-Host Silktide Assets

**User Story:** As a site operator, I want to serve the Silktide JS and CSS from my own domain, so that I have full control over the consent manager code and eliminate third-party CDN dependency.

#### Acceptance Criteria

1. THE Consent_Manager SHALL place the Silktide JavaScript file at a path served under the site's own origin (e.g. `/legal/cookieconsent.js`)
2. THE Consent_Manager SHALL place the Silktide CSS file at a path served under the site's own origin (e.g. `/legal/cookieconsent.css`)
3. WHEN a browser requests the Silktide JS or CSS files, THE Consent_Manager SHALL serve them with `Cache-Control: public, max-age=31536000, immutable`
4. THE Consent_Manager SHALL load the Silktide script with the `defer` attribute so it does not block page rendering

---

### Requirement 3: Set Google Consent Mode v2 Defaults

**User Story:** As a site operator, I want to push denied consent defaults to the data layer before GTM loads, so that Google tags respect user consent from the very first page view.

#### Acceptance Criteria

1. WHEN the page loads, THE Consent_Manager SHALL push a `gtag('consent', 'default', {...})` call to `window.dataLayer` before the GTM `<script>` tag executes
2. THE Consent_Manager SHALL set `analytics_storage: 'denied'` as the default consent state
3. THE Consent_Manager SHALL set `ad_storage: 'denied'` as the default consent state
4. THE Consent_Manager SHALL set `ad_user_data: 'denied'` as the default consent state
5. THE Consent_Manager SHALL set `ad_personalization: 'denied'` as the default consent state
6. THE Consent_Manager SHALL set `wait_for_update: 500` in the default consent call to allow the banner to update consent before tags fire

---

### Requirement 4: Handle Consent Callbacks

**User Story:** As a site operator, I want analytics and marketing consent to update GTM when the user accepts or rejects, so that Google tags fire only when the user has given valid consent.

#### Acceptance Criteria

1. WHEN the user accepts analytics cookies, THE Consent_Manager SHALL push `gtag('consent', 'update', { analytics_storage: 'granted' })` to `window.dataLayer`
2. WHEN the user accepts marketing cookies, THE Consent_Manager SHALL push `gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })` to `window.dataLayer`
3. WHEN the user rejects analytics cookies, THE Consent_Manager SHALL push `gtag('consent', 'update', { analytics_storage: 'denied' })` to `window.dataLayer`
4. WHEN the user rejects marketing cookies, THE Consent_Manager SHALL push `gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })` to `window.dataLayer`
5. WHEN the user has previously given consent and revisits the site, THE Consent_Manager SHALL restore the prior consent state without showing the banner again

---

### Requirement 5: Configure the Consent Banner

**User Story:** As a site operator, I want the consent banner to be correctly configured with appropriate text and cookie categories, so that users can make an informed consent choice.

#### Acceptance Criteria

1. THE Consent_Manager SHALL display a consent banner with at minimum two cookie categories: analytics and marketing
2. THE Consent_Manager SHALL position the banner at the bottom of the viewport using `position: fixed` so it does not push page content down
3. THE Consent_Manager SHALL include an "Accept All" and a "Reject All" action in the banner
4. WHERE the user's browser language is set, THE Consent_Manager SHALL display the banner in the detected language if a translation is available, otherwise falling back to English
5. THE Consent_Manager SHALL not set any analytics or marketing cookies before the user has interacted with the banner
6. WHEN the banner is rendered on a viewport narrower than 768px, THE Consent_Banner SHALL occupy no more than 40% of the visible viewport height so that page content remains visible and accessible behind it
7. THE Consent_Banner SHALL NOT render as a full-viewport modal or interstitial on any screen size

---

### Requirement 6: Update Content Security Policy

**User Story:** As a site operator, I want the CSP to permit the self-hosted Silktide assets and block the old Cookiebot domains, so that the security posture of the site is maintained or improved.

#### Acceptance Criteria

1. THE Consent_Manager SHALL update `script-src` in the CSP to include `'self'` coverage for the self-hosted Silktide JS path
2. THE Consent_Manager SHALL remove `https://consent.cookiebot.com` and `https://consentcdn.cookiebot.com` from `script-src`
3. THE Consent_Manager SHALL remove `https://consent.cookiebot.com` from `frame-src`
4. WHEN GTM is in use, THE Consent_Manager SHALL ensure `https://www.googletagmanager.com` remains permitted in `script-src`
5. IF the Silktide CSS injects inline styles, THEN THE Consent_Manager SHALL ensure `'unsafe-inline'` remains in `style-src` or a nonce-based alternative is used

---

### Requirement 7: Bot SSR Compatibility

**User Story:** As a site operator, I want the consent banner script to be excluded from bot-rendered pages, so that crawlers are not blocked or confused by consent UI.

#### Acceptance Criteria

1. WHILE a request is identified as a bot by the `isBot()` detector, THE Consent_Manager SHALL omit the Silktide `<script>` and `<link>` tags from the bot-SSR HTML response
2. WHILE a request is identified as a bot, THE Consent_Manager SHALL omit the GCM default consent `<script>` block from the bot-SSR HTML response
3. THE Consent_Manager SHALL ensure bot-SSR pages remain valid HTML without any consent-related placeholders or empty script tags


---

### Requirement 8: Core Web Vitals & SEO Safety

**User Story:** As a site operator, I want the consent banner implementation to have no negative impact on Core Web Vitals or search engine crawlability, so that SEO rankings and Google's performance signals are preserved.

#### Acceptance Criteria

1. THE Consent_Banner SHALL use `position: fixed` CSS positioning so that its insertion into the DOM produces zero Cumulative Layout Shift (CLS contribution = 0) on the surrounding page content
2. THE Consent_Manager SHALL load its script with the `defer` attribute so that it is never the Largest Contentful Paint element and does not delay LCP on any viewport size including mobile
3. WHEN a user interacts with the "Accept All" or "Reject All" button, THE Consent_Banner SHALL process the interaction and update consent state within 200ms so that Interaction to Next Paint (INP) remains within the "Good" threshold
4. THE Consent_Manager SHALL ensure its JavaScript execution does not block the main thread for more than 50ms during initial page load
5. THE Consent_Manager SHALL set `analytics_storage: 'denied'` and `ad_storage: 'denied'` as GCM v2 defaults, which enables Google's conversion modelling for opted-out users and preserves GA4 data accuracy without requiring cookie consent
6. THE Consent_Manager SHALL ensure the `robots.txt` file permits the Silktide_Crawler user-agent so that the Silktide cookie auditor can scan the site without being blocked
7. WHEN the Silktide_Crawler visits the site, THE Consent_Manager SHALL ensure the crawler is not served the consent banner UI so that it can audit cookies without consuming unnecessary crawl budget
