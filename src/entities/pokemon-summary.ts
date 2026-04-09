/**
 * Domain view of a Pokémon for the MVP stats screen (mapped from PokeAPI / pokenode-ts).
 */
export type PokemonStatRow = {
  name: string;
  baseStat: number;
};

export type PokemonSummary = {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: string[];
  stats: PokemonStatRow[];
  /** Decimetres */
  heightDm: number;
  /** Hectograms */
  weightHg: number;
};
