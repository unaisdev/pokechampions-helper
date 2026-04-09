import type { PokemonStatRow } from '@src/entities/pokemon-summary';

/** Máximo de la escala visual para stats base (barra completa = este valor). */
export const POKEMON_BASE_STAT_BAR_MAX = 255;

/** Nivel usado para el rango min–max por IV/EV en la UI (fórmula oficial Gen 3+). */
export const POKEMON_STAT_RANGE_DISPLAY_LEVEL = 50;

const MAX_IV = 31;
const MAX_EV_PER_STAT = 252;

/** Naturaleza desfavorable / favorable en la stat (no aplica a PS). */
const NATURE_STAT_MULT_LOW = 0.9;
const NATURE_STAT_MULT_HIGH = 1.1;

/**
 * Stat final en combate (Gen 3+). HP no usa multiplicador de naturaleza.
 * @see https://bulbapedia.bulbagarden.net/wiki/Stat#Determination_of_stats
 */
export function pokemonFinalStatAtLevel(params: {
  base: number;
  iv: number;
  ev: number;
  level: number;
  isHp: boolean;
  /** Solo aplica a stats que no son HP; 1 = naturaleza neutra. */
  natureMultiplier?: number;
}): number {
  const { base, iv, ev, level, isHp, natureMultiplier = 1 } = params;
  const inner = Math.floor((2 * base + iv + Math.floor(ev / 4)) * (level / 100));
  if (isHp) {
    return inner + level + 10;
  }
  return Math.floor((inner + 5) * natureMultiplier);
}

/** Rango posible con IV 0 / EV 0 … IV 31 / EV 252 y naturaleza neutra. */
export function pokemonStatMinMaxNeutral(params: {
  base: number;
  level: number;
  isHp: boolean;
}): { min: number; max: number } {
  const { base, level, isHp } = params;
  const min = pokemonFinalStatAtLevel({
    base,
    level,
    isHp,
    iv: 0,
    ev: 0,
    natureMultiplier: 1,
  });
  const max = pokemonFinalStatAtLevel({
    base,
    level,
    isHp,
    iv: MAX_IV,
    ev: MAX_EV_PER_STAT,
    natureMultiplier: 1,
  });
  return { min, max };
}

/**
 * Rango extremo IV/EV a un nivel. PS: solo IV/EV (sin naturaleza).
 * Resto: mínimo con ×0,9 y máximo con ×1,1 (naturaleza desfavorable / favorable).
 */
export function pokemonStatMinMaxIvEvNatureSpread(params: {
  base: number;
  level: number;
  isHp: boolean;
}): { min: number; max: number } {
  const { base, level, isHp } = params;
  if (isHp) {
    return pokemonStatMinMaxNeutral(params);
  }
  const min = pokemonFinalStatAtLevel({
    base,
    level,
    isHp: false,
    iv: 0,
    ev: 0,
    natureMultiplier: NATURE_STAT_MULT_LOW,
  });
  const max = pokemonFinalStatAtLevel({
    base,
    level,
    isHp: false,
    iv: MAX_IV,
    ev: MAX_EV_PER_STAT,
    natureMultiplier: NATURE_STAT_MULT_HIGH,
  });
  return { min, max };
}

export function isHpStatName(statName: string): boolean {
  return statName === 'hp';
}

/** Orden habitual en combate (PokéAPI stat names). */
const BATTLE_STAT_ORDER = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

const STAT_LABELS_ES: Record<(typeof BATTLE_STAT_ORDER)[number], string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidad',
};

const ORDER_SET = new Set<string>(BATTLE_STAT_ORDER);

/** Stats en orden de combate; el resto se añade al final por nombre. */
export function sortStatsForBattleDisplay(stats: PokemonStatRow[]): PokemonStatRow[] {
  const byName = new Map(stats.map((s) => [s.name, s]));
  const ordered: PokemonStatRow[] = [];
  for (const key of BATTLE_STAT_ORDER) {
    const row = byName.get(key);
    if (row) ordered.push(row);
  }
  const rest = stats.filter((s) => !ORDER_SET.has(s.name));
  rest.sort((a, b) => a.name.localeCompare(b.name));
  return [...ordered, ...rest];
}

export function statLabelEs(statName: string): string {
  if (ORDER_SET.has(statName) && statName in STAT_LABELS_ES) {
    return STAT_LABELS_ES[statName as keyof typeof STAT_LABELS_ES];
  }
  return statName.replace(/-/g, ' ');
}
