/**
 * Domain view of a Pokémon for the MVP stats screen (mapped from PokeAPI / pokenode-ts).
 */
export type PokemonStatRow = {
  name: string;
  baseStat: number;
};

/** One elemental type on the Pokémon (slot order preserved). */
export type PokemonTypeSlot = {
  name: string;
  /** Small icon from PokeAPI/sprites; null if type id could not be parsed. */
  iconUrl: string | null;
};

/** Ability slot from PokéAPI (normal vs hidden). */
export type PokemonAbilitySlot = {
  name: string;
  isHidden: boolean;
  slot: number;
  /** Brief effect from PokéAPI (`short_effect`), es → en when available. */
  shortEffect: string | null;
};

/** Mega (or dual mega) variety slugs from `/pokemon-species` varieties. */
export type PokemonMegaFormOption = {
  slug: string;
  label: string;
};

export type PokemonSummary = {
  id: number;
  name: string;
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
};
