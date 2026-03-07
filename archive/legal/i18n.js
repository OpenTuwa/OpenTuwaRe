// i18n.js - Specialized Localization Script

const langDisplayNames = {
    'en': 'English (US)',
    'zh': '中文 (Chinese)',
    'hi': 'हिन्दी (Hindi)',
    'es': 'Español (Spanish)',
    'es-MX': 'Español (Mexican Spanish)',
    'fr': 'Français (French)',
    'ar': 'العربية (Arabic)',
    'ar-EG': 'العربية (Arabic - Egypt)',
    'ar-MA': 'العربية (Arabic - Morocco)',
    'ar-SA': 'العربية (Arabic - Saudi Arabia)',
    'bn': 'বাংলা (Bengali)',
    'ru': 'Русский (Russian)',
    'pt': 'Português (Portuguese)',
    'ur': 'اردو (Urdu)',
    'ja': '日本語 (Japanese)',
    'de': 'Deutsch (German)',
    'id': 'Bahasa Indonesia (Indonesian)',
    'tr': 'Türkçe (Turkish)'
};

let currentLang = localStorage.getItem('tuwa_lang') || 'en';

// Banner logic
function closeBanner() {
    document.getElementById('langBanner').classList.add('hidden');
}

function openLangModal() {
    document.getElementById('langModal').classList.add('active');
}

function closeLangModal() {
    document.getElementById('langModal').classList.remove('active');
}

// Core i18n logic
function setLanguage(langCode) {
    if (!translations[langCode]) return;
    
    currentLang = langCode;
    localStorage.setItem('tuwa_lang', langCode);
    
    // Update the banner text
    document.getElementById('currentLangDisplay').textContent = langDisplayNames[langCode];
    
    // Update document direction for RTL languages (Arabic and all its dialects, Urdu)
    if (langCode.startsWith('ar') || langCode === 'ur') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    // Apply translations to all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            // Using innerHTML to preserve <strong> tags and HTML entities
            el.innerHTML = translations[currentLang][key];
        }
    });

    closeLangModal();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});