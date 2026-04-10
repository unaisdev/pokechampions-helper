import type { Move } from 'pokenode-ts';

/** Localized flavor (Pokédex-style) from `flavor_text_entries`. */
export function moveFlavorTextForLocales(move: Move, locales: string[]): string | null {
  const entries = move.flavor_text_entries ?? [];
  for (const locale of locales) {
    const hit = entries.find((f) => f.language.name === locale);
    const raw = hit?.flavor_text?.trim();
    if (raw) {
      return normalizeMoveMultilineText(raw);
    }
  }
  return null;
}

/** Raw `short_effect` from `effect_entries` (may contain `$effect_chance`). */
export function moveShortEffectRawForLocales(move: Move, locales: string[]): string | null {
  const entries = move.effect_entries ?? [];
  for (const locale of locales) {
    const hit = entries.find((e) => e.language.name === locale);
    const raw = hit?.short_effect?.trim();
    if (raw) {
      return normalizeMoveMultilineText(raw);
    }
  }
  return null;
}

/**
 * Replaces `$effect_chance` in PokéAPI effect text with the numeric chance when present.
 */
export function formatMoveEffectPlaceholders(shortEffect: string, effectChance: number | null): string {
  let s = shortEffect;
  if (effectChance != null && s.includes('$effect_chance')) {
    s = s.replace(/\$effect_chance/g, String(effectChance));
  }
  return s;
}

function normalizeMoveMultilineText(s: string): string {
  return s
    .replace(/\f/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
