// Google Translate Client helper and language persistence
// Native source language of the portfolio is English (from API & codebase).

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English (Original)', flag: '🇬🇧' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: number;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Completely clears all Google Translate cookies across all host variations
 */
export function clearLanguageCookie(): void {
  if (typeof document === 'undefined') return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');
  const rootDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : '';

  const clearCookie = (name: string, domain?: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    if (domain) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
    }
  };

  clearCookie('googtrans');
  clearCookie('googtrans', hostname);
  if (rootDomain) clearCookie('googtrans', rootDomain);
}

/**
 * Set the googtrans cookie across domains for non-English target languages
 */
export function setLanguageCookie(langCode: string): void {
  if (typeof document === 'undefined') return;

  if (langCode === 'en') {
    clearLanguageCookie();
    localStorage.setItem('user_preferred_lang', 'en');
    return;
  }

  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');
  const rootDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : '';

  // Translate from native English (/en/{targetLang})
  const cookieVal = `/en/${langCode}`;
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
  if (rootDomain) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
  }
  localStorage.setItem('user_preferred_lang', langCode);
}

/**
 * Get currently selected language code from localStorage or cookie (default: 'en')
 */
export function getSavedLanguage(): string {
  if (typeof document === 'undefined') return 'en';

  const local = localStorage.getItem('user_preferred_lang');
  if (local) return local;

  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/([^/]+)\/([^;]+)/);
  if (match && match[2]) {
    return match[2];
  }

  return 'en';
}

/**
 * Initialize Google Translate script and element with English as the native source language.
 * Does NOT translate by default; original English API content is preserved as-is.
 */
export function initGoogleTranslate(): void {
  if (typeof window === 'undefined') return;

  const savedLang = localStorage.getItem('user_preferred_lang');
  if (!savedLang || savedLang === 'en') {
    // English is the native website content - no translation applied
    clearLanguageCookie();
    localStorage.setItem('user_preferred_lang', 'en');
  } else {
    // Restore user's non-English translation preference
    setLanguageCookie(savedLang);
  }

  // Ensure hidden Google Translate container exists in DOM
  let container = document.getElementById('google_translate_element');
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  // Define global init callback with pageLanguage set to 'en'
  window.googleTranslateElementInit = () => {
    if (window.google?.translate?.TranslateElement) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: SUPPORTED_LANGUAGES.map((l) => l.code).join(','),
          autoDisplay: false,
        },
        'google_translate_element'
      );
    }
  };

  // Inject Google Translate client script once
  const existingScript = document.getElementById('google-translate-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
}

/**
 * Switch page translation:
 * - If 'en': clears translation and reloads to show pristine native English content.
 * - If other language: sets cookie and triggers translation from native English.
 */
export function changeLanguage(targetLang: string): void {
  if (typeof document === 'undefined') return;

  const currentLang = getSavedLanguage();
  if (currentLang === targetLang) return;

  if (targetLang === 'en') {
    // Revert completely to native English (no translation)
    clearLanguageCookie();
    localStorage.setItem('user_preferred_lang', 'en');

    const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (selectEl) {
      selectEl.value = 'en';
      selectEl.dispatchEvent(new Event('change'));
    }
    window.location.reload();
    return;
  }

  // Set translation cookie for target language (e.g. /en/id)
  setLanguageCookie(targetLang);

  // Attempt instant change via hidden Google select element
  const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (selectEl) {
    selectEl.value = targetLang;
    selectEl.dispatchEvent(new Event('change'));
  } else {
    // If element is not in DOM yet, reload with cookie applied
    window.location.reload();
  }
}
