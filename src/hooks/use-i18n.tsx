import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '@/lib/i18n';

/**
 * Custom hook for i18n functionality
 * Provides translation function and language switching
 *
 * @example
 * const { t, changeLanguage, currentLanguage } = useI18n();
 *
 * // Use translation
 * <h1>{t('common.welcome')}</h1>
 *
 * // Change language
 * <button onClick={() => changeLanguage('es')}>Español</button>
 */
export function useI18n() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

  return {
    t,
    changeLanguage,
    currentLanguage: i18n.language as SupportedLanguage,
    i18n,
  };
}
