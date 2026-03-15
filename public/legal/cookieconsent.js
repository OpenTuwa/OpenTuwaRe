// Silktide Consent Manager - https://silktide.com/consent-manager/
'use strict';

/**
 * Silktide Consent Manager v2.0
 * https://silktide.com/consent-manager/
 * This class is typically not instantiated directly. Use the global
 * window.silktideConsentManager API below.
 * 
 * @class
 * @param {Object} config - Configuration object for the consent manager
 */
class SilktideConsentManager {
  constructor(config) {
    this._validateConfig(config);
    this.config = config;

    // Set default eventName if not provided
    this.config.eventName = this.config.eventName || 'stcm_consent_update';
    
    // Set default debug mode (false = no console logs in production)
    // Ensure debug is a boolean, default to false
    this.config.debug = this.config.debug === true;

    this.wrapper = null;
    this.prompt = null;
    this.preferences = null;
    this.icon = null;
    this.backdrop = null;
    this.localStorageAvailable = this._checkLocalStorageAvailable();
    this._needsReload = false;

    this.createWrapper();

    if (this.shouldShowBackdrop()) {
      this.createBackdrop();
    }

    this.createCookieIcon();
    this.createModal();

    if (this.shouldShowPrompt()) {
      this.createBanner();
      this.showBackdrop();
    } else {
      this.showCookieIcon();
    }

    this.setupEventListeners();

    // Always run consent callbacks on load (handles required consents even on first visit)
    this.runConsentCallbacksOnLoad();
  }

  /**
   * Validate configuration object
   * @private
   * @param {Object} config - Configuration to validate
   * @throws {Error} If config is invalid
   */
  _validateConfig(config) {
    if (!config) {
      throw new Error('Silktide Consent Manager: config is required');
    }
    if (!config.consentTypes || !Array.isArray(config.consentTypes)) {
      throw new Error('Silktide Consent Manager: config.consentTypes must be an array');
    }
    if (config.consentTypes.length === 0) {
      throw new Error('Silktide Consent Manager: config.consentTypes cannot be empty');
    }
  }

  /**
   * Check if localStorage is available and accessible
   * @private
   * @returns {boolean} True if localStorage can be used
   */
  _checkLocalStorageAvailable() {
    try {
      const testKey = '__stcm_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('Silktide Consent Manager: localStorage is not available. Consent choices will not persist.', e);
      return false;
    }
  }

  /**
   * Safely get item from localStorage with error handling
   * @private
   * @param {string} key - localStorage key
   * @returns {string|null} Value from localStorage or null
   */
  _getLocalStorageItem(key) {
    if (!this.localStorageAvailable) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Silktide Consent Manager: Error reading from localStorage', e);
      return null;
    }
  }

  /**
   * Safely set item in localStorage with error handling
   * @private
   * @param {string} key - localStorage key
   * @param {string} value - Value to store
   * @returns {boolean} True if successful
   */
  _setLocalStorageItem(key, value) {
    if (!this.localStorageAvailable) {
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Silktide Consent Manager: Error writing to localStorage', e);
      return false;
    }
  }

  /**
   * Safely remove item from localStorage with error handling
   * @private
   * @param {string} key - localStorage key
   * @returns {boolean} True if successful
   */
  _removeLocalStorageItem(key) {
    if (!this.localStorageAvailable) {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Silktide Consent Manager: Error removing from localStorage', e);
      return false;
    }
  }

  /**
   * Clean up and remove all consent manager elements from the DOM
   */
  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.allowBodyScroll();
    this.wrapper = null;
    this.prompt = null;
    this.preferences = null;
    this.icon = null;
    this.backdrop = null;
  }

  /**
   * Clear all consent choices from localStorage
   */
  clearAllConsents() {
    if (!this.localStorageAvailable) {
      return;
    }
    const keysToRemove = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('silktideCookieBanner_') ||
          key.startsWith('silktideCookieChoice_') ||
          key.startsWith('stcm.')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this._removeLocalStorageItem(key));
    } catch (e) {
      // Ignore errors
    }
  }

  // Old key builders (for migration only)
  _buildOldConsentKey(typeId) {
    const suffix = this.config.namespace ? `_${this.config.namespace}` : '';
    return `silktideCookieChoice_${typeId}${suffix}`;
  }

  _buildOldHasConsentedKey() {
    const suffix = this.config.namespace ? `_${this.config.namespace}` : '';
    return `silktideCookieBanner_InitialChoice${suffix}`;
  }

  // New key builders
  _buildConsentKey(typeId) {
    const ns = this.config.namespace ? `${this.config.namespace}.` : '';
    return `stcm.${ns}consent.${typeId}`;
  }

  _buildHasConsentedKey() {
    const ns = this.config.namespace ? `${this.config.namespace}.` : '';
    return `stcm.${ns}hasConsented`;
  }

  getConsentChoice(typeId) {
    const newKey = this._buildConsentKey(typeId);
    let value = this._getLocalStorageItem(newKey);
    if (value === null) {
      const oldKey = this._buildOldConsentKey(typeId);
      value = this._getLocalStorageItem(oldKey);
      if (value !== null) {
        this._setLocalStorageItem(newKey, value);
        this._removeLocalStorageItem(oldKey);
      }
    }
    return value === null ? null : value === 'true';
  }

  setConsentChoice(typeId, accepted) {
    const newKey = this._buildConsentKey(typeId);
    this._setLocalStorageItem(newKey, accepted.toString());
    const oldKey = this._buildOldConsentKey(typeId);
    if (this._getLocalStorageItem(oldKey) !== null) {
      this._removeLocalStorageItem(oldKey);
    }
  }

  getHasConsented() {
    const newKey = this._buildHasConsentedKey();
    let value = this._getLocalStorageItem(newKey);
    if (value === null) {
      const oldKey = this._buildOldHasConsentedKey();
      value = this._getLocalStorageItem(oldKey);
      if (value !== null) {
        this._setLocalStorageItem(newKey, value);
        this._removeLocalStorageItem(oldKey);
      }
    }
    return value !== null;
  }

  setHasConsented() {
    const newKey = this._buildHasConsentedKey();
    this._setLocalStorageItem(newKey, '1');
    const oldKey = this._buildOldHasConsentedKey();
    if (this._getLocalStorageItem(oldKey) !== null) {
      this._removeLocalStorageItem(oldKey);
    }
  }

  // ----------------------------------------------------------------
  // Script Injection
  // ----------------------------------------------------------------

  _injectScript(scriptConfig, consentId) {
    const { url, load, type, crossorigin, integrity } = scriptConfig;
    if (!url) {
      console.warn('Silktide Consent Manager: Script URL is required', scriptConfig);
      return;
    }
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.dataset.consentId = consentId;
    if (load === 'async') script.async = true;
    if (load === 'defer') script.defer = true;
    if (type) script.type = type;
    if (crossorigin) script.crossOrigin = crossorigin;
    if (integrity) script.integrity = integrity;
    document.head.appendChild(script);
  }

  _injectConsentScripts(consentType) {
    if (!consentType.scripts || !Array.isArray(consentType.scripts)) {
      return;
    }
    consentType.scripts.forEach(scriptConfig => {
      this._injectScript(scriptConfig, consentType.id);
    });
  }

  _wasConsentRevoked(consentId, newState) {
    const previousState = this.getConsentChoice(consentId);
    return previousState === true && newState === false;
  }

  // ----------------------------------------------------------------
  // Wrapper
  // ----------------------------------------------------------------
  createWrapper() {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'stcm-wrapper';
    document.body.insertBefore(this.wrapper, document.body.firstChild);
  }

  createWrapperChild(htmlContent, id) {
    const child = document.createElement('div');
    child.id = id;
    child.innerHTML = htmlContent;
    if (!this.wrapper || !document.body.contains(this.wrapper)) {
      this.createWrapper();
    }
    this.wrapper.appendChild(child);
    return child;
  }

  // ----------------------------------------------------------------
  // Backdrop
  // ----------------------------------------------------------------
  createBackdrop() {
    this.backdrop = this.createWrapperChild(null, 'stcm-backdrop');
    this.backdrop.addEventListener('click', () => {
      this.nudgePrompt();
    });
  }

  showBackdrop() {
    if (this.backdrop) {
      this.backdrop.style.display = 'block';
    }
    if (typeof this.config.onBackdropOpen === 'function') {
      this.config.onBackdropOpen();
    }
  }

  hideBackdrop() {
    if (this.backdrop) {
      this.backdrop.style.display = 'none';
    }
    if (typeof this.config.onBackdropClose === 'function') {
      this.config.onBackdropClose();
    }
  }

  shouldShowBackdrop() {
    return this.config?.backdrop?.show || false;
  }

  nudgePrompt() {
    if (!this.prompt) {
      return;
    }
    this.prompt.classList.remove('stcm-nudge');
    void this.prompt.offsetWidth;
    this.prompt.classList.add('stcm-nudge');
    this.prompt.addEventListener('animationend', () => {
      if (this.prompt) {
        this.prompt.classList.remove('stcm-nudge');
      }
    }, { once: true });
  }

  updateCheckboxState(saveToStorage = false) {
    const preferencesSection = this.preferences.querySelector('#stcm-form');
    const checkboxes = preferencesSection.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
      const [, consentId] = checkbox.id.split('consent-');
      const consentType = this.config.consentTypes.find(type => type.id === consentId);
      if (!consentType) return;

      if (saveToStorage) {
        const currentState = checkbox.checked;
        if (consentType.required) {
          this.setConsentChoice(consentId, true);
        } else {
          const previousValue = this.getConsentChoice(consentId);
          const wasRevoked = this._wasConsentRevoked(consentId, currentState);
          const hadScripts = consentType.scripts?.length > 0;
          this.setConsentChoice(consentId, currentState);
          if (currentState !== previousValue) {
            this.triggerConsentIntegration(consentType, currentState);
            if (currentState && typeof consentType.onAccept === 'function') {
              consentType.onAccept();
            } else if (!currentState && typeof consentType.onReject === 'function') {
              consentType.onReject();
            }
          }
          if (wasRevoked && hadScripts) {
            this._needsReload = true;
          }
        }
      } else {
        if (consentType.required) {
          checkbox.checked = true;
          checkbox.disabled = true;
        } else {
          const storedValue = this.getConsentChoice(consentId);
          if (storedValue !== null) {
            checkbox.checked = storedValue;
          } else {
            checkbox.checked = !!consentType.defaultValue;
          }
        }
      }
    });
  }

  triggerConsentIntegration(consentType, accepted) {
    if (!consentType.gtag) {
      return;
    }
    const gtagParams = Array.isArray(consentType.gtag) ? consentType.gtag : [consentType.gtag];
    if (typeof gtag === 'function') {
      const consentState = accepted ? 'granted' : 'denied';
      const consentUpdate = {};
      gtagParams.forEach(param => {
        consentUpdate[param] = consentState;
      });
      gtag('consent', 'update', consentUpdate);
    } else if (gtagParams.includes('analytics_storage')) {
      if (typeof window.silktide === 'function') {
        window.silktide(accepted ? 'consent' : 'unconsent');
      }
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'event': this.config.eventName });
  }

  batchUpdateConsents(consentStates) {
    const changes = [];
    const gtagConsentUpdate = {};
    let hasChanges = false;
    let needsReload = false;

    this.config.consentTypes.forEach((type) => {
      const newState = consentStates[type.id];
      const previousState = this.getConsentChoice(type.id);
      if (newState !== previousState) {
        hasChanges = true;
        changes.push({ type, newState, previousState });
        const wasRevoked = previousState === true && newState === false;
        const hadScripts = type.scripts?.length > 0;
        if (wasRevoked && hadScripts) {
          needsReload = true;
        }
        if (type.gtag) {
          const gtagParams = Array.isArray(type.gtag) ? type.gtag : [type.gtag];
          const consentState = newState ? 'granted' : 'denied';
          gtagParams.forEach(param => {
            gtagConsentUpdate[param] = consentState;
          });
        }
      }
    });

    if (!hasChanges) {
      return false;
    }

    changes.forEach(({ type, newState }) => {
      this.setConsentChoice(type.id, newState);
    });

    if (Object.keys(gtagConsentUpdate).length > 0 && typeof gtag === 'function') {
      gtag('consent', 'update', gtagConsentUpdate);
      if (this.config.debug) {
        console.log('✓ gtag consent updated (from user action):', gtagConsentUpdate);
      }
    } else if (gtagConsentUpdate.analytics_storage) {
      if (typeof window.silktide === 'function') {
        const analyticsGranted = gtagConsentUpdate.analytics_storage === 'granted';
        window.silktide(analyticsGranted ? 'consent' : 'unconsent');
      }
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'event': this.config.eventName });
    if (this.config.debug) {
      console.log('▶ GTM Event Sent: ' + this.config.eventName + ' (from user action)');
    }

    changes.forEach(({ type, newState }) => {
      if (newState) {
        this._injectConsentScripts(type);
        if (typeof type.onAccept === 'function') {
          type.onAccept();
        }
      } else {
        if (typeof type.onReject === 'function') {
          type.onReject();
        }
      }
    });

    if (needsReload) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }

    return true;
  }

  // ----------------------------------------------------------------
  // Consent Handling
  // ----------------------------------------------------------------
  handleConsentChoice(accepted) {
    this.setHasConsented();
    this.removeBanner();
    this.hideBackdrop();
    this.toggleModal(false);
    this.showCookieIcon();

    const consentStates = {};
    this.config.consentTypes.forEach((type) => {
      if (type.required) {
        consentStates[type.id] = true;
      } else {
        consentStates[type.id] = accepted;
      }
    });

    this.batchUpdateConsents(consentStates);

    if (accepted && typeof this.config.onAcceptAll === 'function') {
      this.config.onAcceptAll();
    } else if (!accepted && typeof this.config.onRejectAll === 'function') {
      this.config.onRejectAll();
    }

    this.updateCheckboxState();
  }

  getAcceptedConsents() {
    return (this.config.consentTypes || []).reduce((acc, consentType) => {
      acc[consentType.id] = this.getConsentChoice(consentType.id);
      return acc;
    }, {});
  }

  getRejectedConsents() {
    return (this.config.consentTypes || []).reduce((acc, consentType) => {
      const choice = this.getConsentChoice(consentType.id);
      acc[consentType.id] = choice === false;
      return acc;
    }, {});
  }

  runConsentCallbacksOnLoad() {
    if (!this.config.consentTypes) return;

    const gtagConsentUpdate = {};
    let hasGtagUpdates = false;
    let isFirstConsentLoad = false;

    const acceptedConsents = this.getAcceptedConsents();
    const rejectedConsents = this.getRejectedConsents();

    this.config.consentTypes.forEach((type) => {
      if (type.required) {
        const currentValue = this.getConsentChoice(type.id);
        if (currentValue === null) {
          this.setConsentChoice(type.id, true);
          isFirstConsentLoad = true;
        }
        this._injectConsentScripts(type);
        if (type.gtag) {
          hasGtagUpdates = true;
          const gtagParams = Array.isArray(type.gtag) ? type.gtag : [type.gtag];
          gtagParams.forEach(param => {
            gtagConsentUpdate[param] = 'granted';
          });
        }
        if (typeof type.onAccept === 'function') {
          type.onAccept();
        }
        return;
      }

      if (acceptedConsents[type.id]) {
        this._injectConsentScripts(type);
        if (type.gtag) {
          hasGtagUpdates = true;
          const gtagParams = Array.isArray(type.gtag) ? type.gtag : [type.gtag];
          gtagParams.forEach(param => {
            gtagConsentUpdate[param] = 'granted';
          });
        }
        if (typeof type.onAccept === 'function') {
          type.onAccept();
        }
      } else if (rejectedConsents[type.id]) {
        if (type.gtag) {
          hasGtagUpdates = true;
          const gtagParams = Array.isArray(type.gtag) ? type.gtag : [type.gtag];
          gtagParams.forEach(param => {
            gtagConsentUpdate[param] = 'denied';
          });
        }
        if (typeof type.onReject === 'function') {
          type.onReject();
        }
      }
    });

    if (hasGtagUpdates && typeof gtag === 'function') {
      gtag('consent', 'update', gtagConsentUpdate);
      if (this.config.debug) {
        console.log('✓ gtag consent updated (on page load):', gtagConsentUpdate);
      }
    } else if (gtagConsentUpdate.analytics_storage && typeof window.silktide === 'function') {
      const analyticsGranted = gtagConsentUpdate.analytics_storage === 'granted';
      window.silktide(analyticsGranted ? 'consent' : 'unconsent');
    }

    const hasGrantedConsents = Object.values(gtagConsentUpdate).some(value => value === 'granted');
    if (hasGtagUpdates && hasGrantedConsents) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'event': this.config.eventName });
      if (this.config.debug) {
        const eventContext = isFirstConsentLoad ? 'from first page load' : 'from return visit';
        console.log('▶ GTM Event Sent: ' + this.config.eventName + ' (' + eventContext + ')');
      }
    }
  }

  runStoredConsentCallbacks() {
    this.config.consentTypes.forEach((type) => {
      const accepted = this.getConsentChoice(type.id);
      if (accepted) {
        this._injectConsentScripts(type);
      }
      this.triggerConsentIntegration(type, accepted);
      if (accepted) {
        if (typeof type.onAccept === 'function') {
          type.onAccept();
        }
      } else {
        if (typeof type.onReject === 'function') {
          type.onReject();
        }
      }
    });
  }

  // ----------------------------------------------------------------
  // Banner
  // ----------------------------------------------------------------
  getBannerContent() {
    const bannerDescription =
      this.config.text?.prompt?.description ||
      "<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic.</p>";

    const acceptAllButtonText = this.config.text?.prompt?.acceptAllButtonText || 'Accept all';
    const acceptAllButtonLabel = this.config.text?.prompt?.acceptAllButtonAccessibleLabel;
    const acceptAllButton = `<button class="stcm-accept-all stcm-button stcm-button-primary"${
      acceptAllButtonLabel && acceptAllButtonLabel !== acceptAllButtonText
        ? ` aria-label="${acceptAllButtonLabel}"`
        : ''
    }>${acceptAllButtonText}</button>`;

    const rejectNonEssentialButtonText = this.config.text?.prompt?.rejectNonEssentialButtonText || 'Reject non-essential';
    const rejectNonEssentialButtonLabel = this.config.text?.prompt?.rejectNonEssentialButtonAccessibleLabel;
    const rejectNonEssentialButton = `<button class="stcm-reject-all stcm-button stcm-button-primary"${
      rejectNonEssentialButtonLabel && rejectNonEssentialButtonLabel !== rejectNonEssentialButtonText
        ? ` aria-label="${rejectNonEssentialButtonLabel}"`
        : ''
    }>${rejectNonEssentialButtonText}</button>`;

    const preferencesButtonText = this.config.text?.prompt?.preferencesButtonText || 'Preferences';
    const preferencesButtonLabel = this.config.text?.prompt?.preferencesButtonAccessibleLabel;
    const preferencesButton = `<button class="stcm-preferences-button"${
      preferencesButtonLabel && preferencesButtonLabel !== preferencesButtonText
        ? ` aria-label="${preferencesButtonLabel}"`
        : ''
    }><span>${preferencesButtonText}</span></button>`;

    const silktideLogo = `
      <a class="stcm-logo" href="https://silktide.com/consent-manager" target="_blank" rel="noreferrer" aria-label="Visit the Silktide Consent Manager page">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="inherit">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M14.1096 16.7745C13.8895 17.2055 13.3537 17.3805 12.9129 17.1653L8.28443 14.9055L2.73192 17.7651L11.1025 21.9814C11.909 22.3876 12.8725 22.3591 13.6524 21.9058L20.4345 17.9645C21.2845 17.4704 21.7797 16.5522 21.7164 15.5872L21.7088 15.4704C21.6487 14.5561 21.0962 13.7419 20.2579 13.3326L15.6793 11.0972L10.2283 13.9045L13.71 15.6043C14.1507 15.8195 14.3297 16.3434 14.1096 16.7745ZM8.2627 12.9448L13.7136 10.1375L10.2889 8.46543C9.84803 8.25021 9.66911 7.72629 9.88916 7.29524C10.1093 6.86417 10.6451 6.68921 11.0859 6.90442L15.6575 9.13647L21.2171 6.27325L12.8808 2.03496C12.0675 1.62147 11.0928 1.65154 10.3078 2.11432L3.54908 6.09869C2.70732 6.59492 2.21846 7.50845 2.28139 8.46761L2.29003 8.59923C2.35002 9.51362 2.9026 10.3278 3.7409 10.7371L8.2627 12.9448ZM6.31884 13.9458L2.94386 12.2981C1.53727 11.6113 0.610092 10.2451 0.509431 8.71094L0.500795 8.57933C0.3952 6.96993 1.21547 5.4371 2.62787 4.60447L9.38662 0.620092C10.7038 -0.156419 12.3392 -0.206861 13.7039 0.486938L23.3799 5.40639C23.4551 5.44459 23.5224 5.4918 23.5811 5.54596C23.7105 5.62499 23.8209 5.73754 23.897 5.87906C24.1266 6.30534 23.9594 6.83293 23.5234 7.05744L17.6231 10.0961L21.0549 11.7716C22.4615 12.4583 23.3887 13.8245 23.4893 15.3587L23.497 15.4755C23.6033 17.0947 22.7724 18.6354 21.346 19.4644L14.5639 23.4057C13.2554 24.1661 11.6386 24.214 10.2854 23.5324L0.621855 18.6649C0.477299 18.592 0.361696 18.4859 0.279794 18.361C0.210188 18.2968 0.150054 18.2204 0.10296 18.133C-0.126635 17.7067 0.0406445 17.1792 0.47659 16.9546L6.31884 13.9458Z" fill="inherit"/>
        </svg>
      </a>
    `;

    return `
      ${bannerDescription}
      <div class="stcm-actions">
        ${acceptAllButton}
        ${rejectNonEssentialButton}
        <div class="stcm-actions-row">
          ${preferencesButton}
          ${silktideLogo}
        </div>
      </div>
    `;
  }

  hasConsented() {
    return this.getHasConsented();
  }

  createBanner() {
    this.prompt = this.createWrapperChild(this.getBannerContent(), 'stcm-banner');
    if (this.prompt && this.config.prompt?.position) {
      const positionMap = {
        'center': 'stcm-pos-center',
        'bottomLeft': 'stcm-pos-bottom-left',
        'bottomCenter': 'stcm-pos-bottom-center',
        'bottomRight': 'stcm-pos-bottom-right'
      };
      const mappedPosition = positionMap[this.config.prompt.position] || this.config.prompt.position;
      this.prompt.classList.add(mappedPosition);
    }
    this.prompt.addEventListener('animationend', () => {
      if (this.prompt) {
        this.prompt.classList.add('stcm-loaded');
      }
    }, { once: true });
    if (this.prompt && typeof this.config.onPromptOpen === 'function') {
      this.config.onPromptOpen();
    }
  }

  removeBanner() {
    if (this.prompt && this.prompt.parentNode) {
      this.prompt.parentNode.removeChild(this.prompt);
      this.prompt = null;
      if (typeof this.config.onPromptClose === 'function') {
        this.config.onPromptClose();
      }
    }
  }

  shouldShowPrompt() {
    if (this.config.autoShow === false) {
      return false;
    }
    return !this.getHasConsented();
  }

  // ----------------------------------------------------------------
  // Modal
  // ----------------------------------------------------------------
  getModalContent() {
    const preferencesTitle =
      this.config.text?.preferences?.title || 'Customize your cookie preferences';

    const preferencesDescription =
      this.config.text?.preferences?.description ||
      "<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website.</p>";

    const preferencesButtonLabel = this.config.text?.prompt?.preferencesButtonAccessibleLabel;

    const closeModalButton = `<button class="stcm-modal-close"${preferencesButtonLabel ? ` aria-label="${preferencesButtonLabel}"` : ''}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.4081 3.41559C20.189 2.6347 20.189 1.36655 19.4081 0.585663C18.6272 -0.195221 17.3591 -0.195221 16.5782 0.585663L10 7.17008L3.41559 0.59191C2.6347 -0.188974 1.36655 -0.188974 0.585663 0.59191C-0.195221 1.37279 -0.195221 2.64095 0.585663 3.42183L7.17008 10L0.59191 16.5844C-0.188974 17.3653 -0.188974 18.6335 0.59191 19.4143C1.37279 20.1952 2.64095 20.1952 3.42183 19.4143L10 12.8299L16.5844 19.4081C17.3653 20.189 18.6335 20.189 19.4143 19.4081C20.1952 18.6272 20.1952 17.3591 19.4143 16.5782L12.8299 10L19.4081 3.41559Z"/>
      </svg>
    </button>`;

    const consentTypes = this.config.consentTypes || [];
    const acceptedConsentMap = this.getAcceptedConsents();

    const saveButtonText = this.config.text?.preferences?.saveButtonText || 'Save and close';
    const saveButtonLabel = this.config.text?.preferences?.saveButtonAccessibleLabel;
    const saveButton = `<button class="stcm-modal-save stcm-button stcm-button-primary"${
      saveButtonLabel && saveButtonLabel !== saveButtonText
        ? ` aria-label="${saveButtonLabel}"`
        : ''
    }>${saveButtonText}</button>`;

    const rejectNonEssentialButtonText = this.config.text?.prompt?.rejectNonEssentialButtonText || 'Reject non-essential';
    const rejectNonEssentialButtonLabel = this.config.text?.prompt?.rejectNonEssentialButtonAccessibleLabel;
    const rejectNonEssentialButton = `<button class="stcm-modal-reject-all stcm-button stcm-button-primary"${
      rejectNonEssentialButtonLabel && rejectNonEssentialButtonLabel !== rejectNonEssentialButtonText
        ? ` aria-label="${rejectNonEssentialButtonLabel}"`
        : ''
    }>${rejectNonEssentialButtonText}</button>`;

    const creditLinkText = this.config.text?.preferences?.creditLinkText || 'Get this consent manager for free';
    const creditLinkAccessibleLabel = this.config.text?.preferences?.creditLinkAccessibleLabel;
    const creditLink = `<a class="stcm-credit-link" href="https://silktide.com/consent-manager" target="_blank" rel="noreferrer"${
      creditLinkAccessibleLabel && creditLinkAccessibleLabel !== creditLinkText
        ? ` aria-label="${creditLinkAccessibleLabel}"`
        : ''
    }>${creditLinkText}</a>`;

    return `
      <header>
        <h1>${preferencesTitle}</h1>
        ${closeModalButton}
      </header>
      ${preferencesDescription}
      <section id="stcm-form">
        ${consentTypes
          .map((type) => {
            const accepted = acceptedConsentMap[type.id];
            let isChecked = false;
            if (accepted) {
              isChecked = true;
            }
            if (!accepted && !this.hasConsented()) {
              isChecked = type.defaultValue;
            }
            return `
            <fieldset>
              <legend>${type.label}</legend>
              <div class="stcm-consent-row">
                <div class="stcm-consent-description">${type.description}</div>
                <label class="stcm-toggle" for="consent-${type.id}">
                  <input type="checkbox" id="consent-${type.id}" ${
              type.required ? 'checked disabled' : isChecked ? 'checked' : ''
            } />
                  <span class="stcm-toggle-track" aria-hidden="true"></span>
                  <span class="stcm-toggle-thumb" aria-hidden="true"></span>
                  <span class="stcm-toggle-off" aria-hidden="true">Off</span>
                  <span class="stcm-toggle-on" aria-hidden="true">On</span>
                </label>
              </div>
            </fieldset>
          `;
          })
          .join('')}
      </section>
      <footer>
        ${saveButton}
        ${rejectNonEssentialButton}
        ${creditLink}
      </footer>
    `;
  }

  createModal() {
    this.preferences = this.createWrapperChild(this.getModalContent(), 'stcm-modal');
  }

  toggleModal(show) {
    if (!this.preferences) return;
    this.preferences.style.display = show ? 'flex' : 'none';
    if (show) {
      this.showBackdrop();
      this.hideCookieIcon();
      this.removeBanner();
      this.preventBodyScroll();
      const modalCloseButton = this.preferences.querySelector('.stcm-modal-close');
      modalCloseButton.focus();
      if (typeof this.config.onPreferencesOpen === 'function') {
        this.config.onPreferencesOpen();
      }
      this.updateCheckboxState(false);
    } else {
      this.hideBackdrop();
      this.showCookieIcon();
      this.allowBodyScroll();
      if (typeof this.config.onPreferencesClose === 'function') {
        this.config.onPreferencesClose();
      }
    }
  }

  // ----------------------------------------------------------------
  // Consent Icon
  // ----------------------------------------------------------------
  getCookieIconContent() {
    return `
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.1172 1.15625C19.0547 0.734374 18.7344 0.390624 18.3125 0.328124C16.5859 0.0859365 14.8281 0.398437 13.2813 1.21875L7.5 4.30469C5.96094 5.125 4.71875 6.41406 3.95313 7.98437L1.08594 13.8906C0.320314 15.4609 0.0703136 17.2422 0.375001 18.9609L1.50781 25.4297C1.8125 27.1562 2.64844 28.7344 3.90625 29.9531L8.61719 34.5156C9.875 35.7344 11.4766 36.5156 13.2031 36.7578L19.6875 37.6719C21.4141 37.9141 23.1719 37.6016 24.7188 36.7812L30.5 33.6953C32.0391 32.875 33.2813 31.5859 34.0469 30.0078L36.9141 24.1094C37.6797 22.5391 37.9297 20.7578 37.625 19.0391C37.5547 18.625 37.2109 18.3125 36.7969 18.25C32.7734 17.6094 29.5469 14.5703 28.6328 10.6406C28.4922 10.0469 28.0078 9.59375 27.4063 9.5C23.1406 8.82031 19.7734 5.4375 19.1094 1.15625H19.1172ZM15.25 10.25C15.913 10.25 16.5489 10.5134 17.0178 10.9822C17.4866 11.4511 17.75 12.087 17.75 12.75C17.75 13.413 17.4866 14.0489 17.0178 14.5178C16.5489 14.9866 15.913 15.25 15.25 15.25C14.587 15.25 13.9511 14.9866 13.4822 14.5178C13.0134 14.0489 12.75 13.413 12.75 12.75C12.75 12.087 13.0134 11.4511 13.4822 10.9822C13.9511 10.5134 14.587 10.25 15.25 10.25ZM10.25 25.25C10.25 24.587 10.5134 23.9511 10.9822 23.4822C11.4511 23.0134 12.087 22.75 12.75 22.75C13.413 22.75 14.0489 23.0134 14.5178 23.4822C14.9866 23.9511 15.25 24.587 15.25 25.25C15.25 25.913 14.9866 26.5489 14.5178 27.0178C14.0489 27.4866 13.413 27.75 12.75 27.75C12.087 27.75 11.4511 27.4866 10.9822 27.0178C10.5134 26.5489 10.25 25.913 10.25 25.25ZM27.75 20.25C28.413 20.25 29.0489 20.5134 29.5178 20.9822C29.9866 21.4511 30.25 22.087 30.25 22.75C30.25 23.413 29.9866 24.0489 29.5178 24.5178C29.0489 24.9866 28.413 25.25 27.75 25.25C27.087 25.25 26.4511 24.9866 25.9822 24.5178C25.5134 24.0489 25.25 23.413 25.25 22.75C25.25 22.087 25.5134 21.4511 25.9822 20.9822C26.4511 20.5134 27.087 20.25 27.75 20.25Z" />
      </svg>
    `;
  }

  createCookieIcon() {
    this.icon = document.createElement('button');
    this.icon.id = 'stcm-icon';
    this.icon.title = 'Manage your consent preferences for this site';
    this.icon.innerHTML = this.getCookieIconContent();
    if (this.config.text?.prompt?.preferencesButtonAccessibleLabel) {
      this.icon.ariaLabel = this.config.text?.prompt?.preferencesButtonAccessibleLabel;
    }
    if (!this.wrapper || !document.body.contains(this.wrapper)) {
      this.createWrapper();
    }
    this.wrapper.appendChild(this.icon);
    if (this.icon && this.config.icon?.position) {
      const positionMap = {
        'bottomRight': 'stcm-pos-bottom-right',
        'bottomLeft': 'stcm-pos-bottom-left'
      };
      const mappedPosition = positionMap[this.config.icon.position] || this.config.icon.position;
      this.icon.classList.add(mappedPosition);
    }
    if (this.icon && this.config.icon?.colorScheme) {
      this.icon.classList.add(this.config.icon.colorScheme);
    }
  }

  showCookieIcon() {
    if (this.icon) {
      this.icon.style.display = 'flex';
    }
  }

  hideCookieIcon() {
    if (this.icon) {
      this.icon.style.display = 'none';
    }
  }

  handleDefaultConsent() {
    this.config.consentTypes.forEach((type) => {
      let accepted = true;
      if (type.required || type.defaultValue) {
        this.setConsentChoice(type.id, true);
      } else {
        accepted = false;
        this.setConsentChoice(type.id, false);
      }
      if (accepted) {
        if (typeof type.onAccept === 'function') {
          type.onAccept();
        }
      } else {
        if (typeof type.onReject === 'function') {
          type.onReject();
        }
      }
      this.setHasConsented();
      this.updateCheckboxState();
    });
  }

  getFocusableElements(element) {
    return element.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
  }

  // ----------------------------------------------------------------
  // Event Listeners
  // ----------------------------------------------------------------
  setupEventListeners() {
    if (this.prompt) {
      const acceptButton = this.prompt.querySelector('.stcm-accept-all');
      const rejectButton = this.prompt.querySelector('.stcm-reject-all');
      const preferencesButton = this.prompt.querySelector('.stcm-preferences-button');

      acceptButton?.addEventListener('click', () => this.handleConsentChoice(true));
      rejectButton?.addEventListener('click', () => this.handleConsentChoice(false));
      preferencesButton?.addEventListener('click', () => {
        this.showBackdrop();
        this.toggleModal(true);
      });

      const focusableElements = this.getFocusableElements(this.prompt);
      const firstFocusableEl = focusableElements[0];
      const lastFocusableEl = focusableElements[focusableElements.length - 1];

      this.prompt.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableEl) {
              lastFocusableEl.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusableEl) {
              firstFocusableEl.focus();
              e.preventDefault();
            }
          }
        }
      });

      if (this.config.mode !== 'wizard') {
        acceptButton?.focus();
      }
    }

    if (this.preferences) {
      const closeButton = this.preferences.querySelector('.stcm-modal-close');
      const saveButton = this.preferences.querySelector('.stcm-modal-save');
      const rejectAllButton = this.preferences.querySelector('.stcm-modal-reject-all');

      closeButton?.addEventListener('click', () => {
        this.toggleModal(false);
        this.hideBackdrop();
      });

      saveButton?.addEventListener('click', () => {
        this.setHasConsented();
        const preferencesSection = this.preferences.querySelector('#stcm-form');
        const checkboxes = preferencesSection.querySelectorAll('input[type="checkbox"]');
        const consentStates = {};
        checkboxes.forEach(checkbox => {
          const [, consentId] = checkbox.id.split('consent-');
          consentStates[consentId] = checkbox.checked;
        });
        this.batchUpdateConsents(consentStates);
        this.toggleModal(false);
        this.hideBackdrop();
        this.removeBanner();
        this.showCookieIcon();
      });

      rejectAllButton?.addEventListener('click', () => {
        this.setHasConsented();
        const preferencesSection = this.preferences.querySelector('#stcm-form');
        const checkboxes = preferencesSection.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          const [, consentId] = checkbox.id.split('consent-');
          const consentType = this.config.consentTypes.find(type => type.id === consentId);
          if (consentType && !consentType.required) {
            checkbox.checked = false;
          }
        });
        const consentStates = {};
        this.config.consentTypes.forEach((type) => {
          consentStates[type.id] = type.required ? true : false;
        });
        this.batchUpdateConsents(consentStates);
        this.toggleModal(false);
        this.hideBackdrop();
        this.removeBanner();
        this.showCookieIcon();
      });

      const focusableElements = this.getFocusableElements(this.preferences);
      const firstFocusableEl = focusableElements[0];
      const lastFocusableEl = focusableElements[focusableElements.length - 1];

      this.preferences.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableEl) {
              lastFocusableEl.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusableEl) {
              firstFocusableEl.focus();
              e.preventDefault();
            }
          }
        }
        if (e.key === 'Escape') {
          this.toggleModal(false);
        }
      });

      closeButton?.focus();
    }

    if (this.icon) {
      this.icon.addEventListener('click', () => {
        if (!this.preferences) {
          this.createModal();
          this.toggleModal(true);
          this.hideCookieIcon();
        } else if (this.preferences.style.display === 'none' || this.preferences.style.display === '') {
          this.toggleModal(true);
          this.hideCookieIcon();
        } else {
          this.toggleModal(false);
        }
      });
    }
  }

  preventBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  allowBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
}

/**
 * ============================================================================
 * Public API (IIFE Wrapper)
 * ============================================================================
 */
(function () {
  window.silktideConsentManager = {};

  let consentManager;

  function init(config = {}) {
    const create = () => {
      if (consentManager) {
        consentManager.destroy();
        consentManager = null;
      }
      consentManager = new SilktideConsentManager(config);
    };

    if (document.body) {
      create();
    } else {
      document.addEventListener('DOMContentLoaded', create, {once: true});
    }
  }

  function update(newConfig = {}) {
    if (!consentManager) {
      console.error('Silktide Consent Manager: Cannot update - no instance initialized. Call init() first.');
      return;
    }

    function deepMerge(target, source) {
      const output = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
      return output;
    }

    const mergedConfig = deepMerge(consentManager.config, newConfig);
    init(mergedConfig);
  }

  function resetConsent() {
    if (!consentManager) {
      console.error('Silktide Consent Manager: Cannot reset - no instance initialized.');
      return;
    }
    consentManager.clearAllConsents();
    init(consentManager.config);
  }

  function getInstance() {
    return consentManager;
  }

  window.silktideConsentManager.init = init;
  window.silktideConsentManager.update = update;
  window.silktideConsentManager.getInstance = getInstance;
  window.silktideConsentManager.resetConsent = resetConsent;
})();
