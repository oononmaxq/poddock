import { translations, defaultLang, type TranslationKey } from '../../../i18n/translations';

export type Lang = keyof typeof translations;

export function getLang(): Lang {
  if (typeof window === 'undefined') return defaultLang;

  // Check localStorage first
  const stored = localStorage.getItem('preferred_language');
  if (stored && stored in translations) {
    return stored as Lang;
  }

  // Then check URL
  const path = window.location.pathname;
  const [, lang] = path.split('/');
  if (lang in translations) {
    return lang as Lang;
  }

  return defaultLang;
}

export function useI18n() {
  const lang = getLang();

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };

  return { lang, t };
}
