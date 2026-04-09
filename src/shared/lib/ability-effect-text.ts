import type { Ability } from 'pokenode-ts';

/** Prefer first locale in order that has a non-empty `short_effect`. */
export function abilityShortEffectForLocales(ability: Ability, locales: string[]): string | null {
  const entries = ability.effect_entries ?? [];
  for (const locale of locales) {
    const hit = entries.find((e) => e.language.name === locale);
    const raw = hit?.short_effect?.trim();
    if (raw) {
      return normalizeAbilityEffectText(raw);
    }
  }
  return null;
}

function normalizeAbilityEffectText(s: string): string {
  return s
    .replace(/\f/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
