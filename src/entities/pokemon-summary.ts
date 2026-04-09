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

export type PokemonSummary = {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: PokemonTypeSlot[];
  stats: PokemonStatRow[];
  /** Decimetres */
  heightDm: number;
  /** Hectograms */
  weightHg: number;
};
