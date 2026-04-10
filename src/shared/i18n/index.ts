import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  ja: { translation: ja },
} as const;

function resolveInitialLanguage(): string {
  const tags = Localization.getLocales?.() ?? [];
  const code = tags[0]?.languageCode?.toLowerCase();
  if (code === 'es') {
    return 'es';
  }
  if (code === 'ja') {
    return 'ja';
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { i18n };
