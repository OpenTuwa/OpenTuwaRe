'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function ConsentManager() {
  const pathname = usePathname();
  const isLegal = pathname === '/legal';

  return (
    <Script
      src="/legal/cookieconsent.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.silktideConsentManager.init({
          consentTypes: [
            {
              id: 'necessary',
              required: true,
              label: 'Necessary',
              description: '<p>These cookies are essential for the website to function correctly and cannot be disabled.</p>',
            },
            {
              id: 'analytics',
              required: false,
              label: 'Analytics',
              description: '<p>These cookies help us understand how visitors interact with the site so we can improve it.</p>',
              gtag: 'analytics_storage',
              onAccept: function () {
                if (typeof gtag === 'function') {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                  window.dataLayer.push({ event: 'consent_accepted_analytics' });
                }
              },
              onReject: function () {
                if (typeof gtag === 'function') {
                  gtag('consent', 'update', { analytics_storage: 'denied' });
                }
              },
            },
            {
              id: 'marketing',
              required: false,
              label: 'Marketing',
              description: '<p>These cookies are used to deliver personalised advertising and track ad performance.</p>',
              gtag: ['ad_storage', 'ad_user_data', 'ad_personalization'],
              onAccept: function () {
                if (typeof gtag === 'function') {
                  gtag('consent', 'update', {
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                  });
                  window.dataLayer.push({ event: 'consent_accepted_marketing' });
                }
              },
              onReject: function () {
                if (typeof gtag === 'function') {
                  gtag('consent', 'update', {
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                  });
                }
              },
            },
          ],
          prompt: { position: 'bottomCenter' },
          icon: { position: 'bottomLeft' },
          text: {
            prompt: {
              description: '<p>We use cookies to enhance your experience and analyse traffic. <a href="/legal#cook-1" target="_blank">Cookie Policy.</a></p>',
              acceptAllButtonText: 'Accept all',
              rejectNonEssentialButtonText: 'Reject non-essential',
              preferencesButtonText: 'Preferences',
            },
            preferences: {
              title: 'Customise your cookie preferences',
              description: '<p>You can choose which types of cookies to allow. Your preferences apply across this website.</p>',
            },
          },
        });

        // Show the floating cookie icon only on the /legal page
        if (isLegal) {
          document.body.classList.add('show-consent-icon');
        }
      }}
    />
  );
}
