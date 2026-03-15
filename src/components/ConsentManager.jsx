'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'ot_consent';

const CONSENT_TYPES = [
  {
    id: 'necessary',
    label: 'Necessary',
    required: true,
    description: 'Essential for the site to function. Cannot be disabled.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    required: false,
    description: 'Helps us understand how visitors use the site so we can improve it.',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    required: false,
    description: 'Used to deliver relevant advertising and track ad performance.',
  },
];

function updateGtag(prefs) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
  });
  if (window.dataLayer) {
    window.dataLayer.push({ event: 'consent_updated', consent_preferences: prefs });
  }
}

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
  } catch {}
}

export default function ConsentManager() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const stored = loadConsent();
    if (stored) {
      setPrefs({ necessary: true, analytics: !!stored.analytics, marketing: !!stored.marketing });
      setHasConsented(true);
      updateGtag(stored);
    } else {
      // No prior consent — show banner after short delay so it doesn't block LCP
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const applyConsent = useCallback((newPrefs) => {
    const final = { ...newPrefs, necessary: true };
    saveConsent(final);
    updateGtag(final);
    setPrefs(final);
    setHasConsented(true);
    setVisible(false);
    setShowModal(false);
  }, []);

  const acceptAll = () => applyConsent({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => applyConsent({ necessary: true, analytics: false, marketing: false });
  const savePrefs = () => applyConsent(prefs);

  const openPreferences = () => {
    setShowModal(true);
    setVisible(false);
  };

  // On /legal, show a button to reopen preferences
  const isLegal = pathname === '/legal';

  if (!visible && !showModal && (!hasConsented || !isLegal)) {
    // Render nothing visible — but on /legal after consent, render the manage button
    if (hasConsented && isLegal) {
      return <ManageButton onClick={() => setShowModal(true)} />;
    }
    return null;
  }

  return (
    <>
      {/* Backdrop for modal */}
      {showModal && (
        <div
          className="ot-backdrop"
          onClick={() => setShowModal(false)}
          aria-hidden="true"
        />
      )}

      {/* Consent Banner */}
      {visible && !showModal && (
        <div className="ot-banner" role="dialog" aria-label="Cookie consent" aria-modal="true">
          <p className="ot-banner-text">
            We use cookies to improve your experience and analyse traffic.{' '}
            <a href="/legal#cookies" className="ot-link">Cookie Policy</a>
          </p>
          <div className="ot-banner-actions">
            <button className="ot-btn ot-btn-primary" onClick={acceptAll}>Accept all</button>
            <button className="ot-btn ot-btn-secondary" onClick={rejectAll}>Reject non-essential</button>
            <button className="ot-btn ot-btn-ghost" onClick={openPreferences}>Preferences</button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showModal && (
        <div className="ot-modal" role="dialog" aria-label="Cookie preferences" aria-modal="true">
          <div className="ot-modal-header">
            <h2 className="ot-modal-title">Cookie Preferences</h2>
            <button
              className="ot-modal-close"
              onClick={() => { setShowModal(false); if (!hasConsented) setVisible(true); }}
              aria-label="Close preferences"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.854 3.146a.5.5 0 0 1 0 .708L8.707 8l4.147 4.146a.5.5 0 0 1-.708.708L8 8.707l-4.146 4.147a.5.5 0 0 1-.708-.708L7.293 8 3.146 3.854a.5.5 0 0 1 .708-.708L8 7.293l4.146-4.147a.5.5 0 0 1 .708 0z"/>
              </svg>
            </button>
          </div>
          <p className="ot-modal-desc">
            Choose which cookies you allow. Your preferences apply across this site.
          </p>
          <div className="ot-modal-types">
            {CONSENT_TYPES.map((type) => (
              <div key={type.id} className="ot-type-row">
                <div className="ot-type-info">
                  <span className="ot-type-label">{type.label}</span>
                  <span className="ot-type-desc">{type.description}</span>
                </div>
                <label className="ot-toggle" aria-label={`${type.label} cookies`}>
                  <input
                    type="checkbox"
                    checked={type.required ? true : prefs[type.id]}
                    disabled={type.required}
                    onChange={(e) => setPrefs((p) => ({ ...p, [type.id]: e.target.checked }))}
                  />
                  <span className="ot-toggle-track">
                    <span className="ot-toggle-thumb" />
                  </span>
                </label>
              </div>
            ))}
          </div>
          <div className="ot-modal-footer">
            <button className="ot-btn ot-btn-primary" onClick={savePrefs}>Save preferences</button>
            <button className="ot-btn ot-btn-secondary" onClick={rejectAll}>Reject all</button>
            <button className="ot-btn ot-btn-ghost" onClick={acceptAll}>Accept all</button>
          </div>
        </div>
      )}

      {/* On /legal, also show manage button when modal is closed */}
      {isLegal && hasConsented && !showModal && (
        <ManageButton onClick={() => setShowModal(true)} />
      )}
    </>
  );
}

function ManageButton({ onClick }) {
  return (
    <button className="ot-manage-btn" onClick={onClick} aria-label="Manage cookie preferences">
      <svg width="20" height="20" viewBox="0 0 38 38" fill="currentColor" aria-hidden="true">
        <path d="M19.1172 1.15625C19.0547 0.734374 18.7344 0.390624 18.3125 0.328124C16.5859 0.0859365 14.8281 0.398437 13.2813 1.21875L7.5 4.30469C5.96094 5.125 4.71875 6.41406 3.95313 7.98437L1.08594 13.8906C0.320314 15.4609 0.0703136 17.2422 0.375001 18.9609L1.50781 25.4297C1.8125 27.1562 2.64844 28.7344 3.90625 29.9531L8.61719 34.5156C9.875 35.7344 11.4766 36.5156 13.2031 36.7578L19.6875 37.6719C21.4141 37.9141 23.1719 37.6016 24.7188 36.7812L30.5 33.6953C32.0391 32.875 33.2813 31.5859 34.0469 30.0078L36.9141 24.1094C37.6797 22.5391 37.9297 20.7578 37.625 19.0391C37.5547 18.625 37.2109 18.3125 36.7969 18.25C32.7734 17.6094 29.5469 14.5703 28.6328 10.6406C28.4922 10.0469 28.0078 9.59375 27.4063 9.5C23.1406 8.82031 19.7734 5.4375 19.1094 1.15625H19.1172Z"/>
      </svg>
      Manage cookies
    </button>
  );
}
