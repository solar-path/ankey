import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import en from './locales/en/translation.json';
import zh from './locales/zh/translation.json';
import es from './locales/es/translation.json';
import ar from './locales/ar/translation.json';
import hi from './locales/hi/translation.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  ar: 'العربية',
  hi: 'हिन्दी',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  es: { translation: es },
  ar: { translation: ar },
  hi: { translation: hi },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    debug: false, // Set to true for debugging
    react: {
      useSuspense: false, // Disable suspense to avoid loading issues
    },
  });

export default i18n;
