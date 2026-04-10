/**
 * Map app i18n language tags to PokéAPI `language.name` (used in `names` / `effect_entries` / etc.).
 * Extend when adding app locales that exist on PokéAPI (e.g. ja, de, fr).
 */
export function appLocaleToPokeApiLanguage(appLocale: string): string {
  const base = appLocale.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
  if (base === 'es') {
    return 'es';
  }
  if (base === 'ja') {
    return 'ja';
  }
  return 'en';
}
