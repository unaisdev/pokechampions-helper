/**
 * Domain view of a Pokémon for the MVP stats screen (mapped from PokeAPI / pokenode-ts).
 */
export type PokemonStatRow = {
  name: string;
  /** Localized label from PokéAPI `stat.names`. */
  displayName: string;
  baseStat: number;
};

/** One elemental type on the Pokémon (slot order preserved). */
export type PokemonTypeSlot = {
  name: string;
  /** Localized label from PokéAPI `type.names` (`language.name` matches `/language/{name}/`). */
  displayName: string;
  /** Small icon from PokeAPI/sprites; null if type id could not be parsed. */
  iconUrl: string | null;
};

/** Ability slot from PokéAPI (normal vs hidden). */
export type PokemonAbilitySlot = {
  name: string;
  /** Localized name from PokéAPI `ability.names`. */
  displayName: string;
  isHidden: boolean;
  slot: number;
  /** Brief effect from PokéAPI (`short_effect`), preferred language → en when available. */
  shortEffect: string | null;
};

/** Mega (or dual mega) variety slugs from `/pokemon-species` varieties. */
export type PokemonMegaFormOption = {
  slug: string;
  label: string;
};

/** Probabilidades extra en `move.meta` (PokéAPI). */
export type PokemonMoveMetaBrief = {
  /** `move.meta.ailment.name` (p. ej. paralysis, burn). */
  ailmentSlug: string | null;
  ailmentChance: number;
  flinchChance: number;
  statChance: number;
};

/** Movimiento que el Pokémon puede aprender (PokéAPI `/move/{name}`). */
export type PokemonMoveLearnable = {
  name: string;
  /** Localized move name from PokéAPI `move.names`. */
  displayName: string;
  typeName: string;
  /** Localized type name from PokéAPI `type.names`. */
  typeDisplayName: string;
  typeIconUrl: string | null;
  /** `damage_class` de PokéAPI: physical / special / status. */
  damageClass: 'physical' | 'special' | 'status' | 'unknown';
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  /** Orden de prioridad en combate (−8 … 8). */
  priority: number;
  /** Probabilidad base del efecto adicional (`effect_chance`). */
  effectChance: number | null;
  /** Efecto breve en combate (`effect_entries.short_effect`), con `$effect_chance` sustituido cuando aplica. */
  shortEffect: string | null;
  /** Texto de Pokédex / sabor (`flavor_text_entries`). */
  flavorText: string | null;
  meta: PokemonMoveMetaBrief | null;
};

export type PokemonSummary = {
  id: number;
  /** PokéAPI slug (internal id). */
  name: string;
  /** Species display name from PokéAPI `pokemon-species.names`. */
  displayName: string;
  spriteUrl: string | null;
  types: PokemonTypeSlot[];
  stats: PokemonStatRow[];
  /** Abilities this species can have in battle (slot order). */
  abilities: PokemonAbilitySlot[];
  /** Base experience awarded when defeated. */
  baseExperience: number;
  /** Decimetres */
  heightDm: number;
  /** Hectograms */
  weightHg: number;
  /** Default variety slug for this species (form base). */
  speciesDefaultFormSlug: string;
  /** Mega evolutions available for this species in PokéAPI; empty if none. */
  megaForms: PokemonMegaFormOption[];
  /**
   * Learnable move slugs from `/pokemon` (union across methods/versions). Details load on demand via repository.
   */
  moveNames: string[];
};
