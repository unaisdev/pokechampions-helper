import type { PokemonSummary } from '@src/entities/pokemon-summary';

export type PokemonRepository = {
  getByName(rawName: string): Promise<PokemonSummary>;
  /**
   * All `/pokemon/{slug}` forms for the same species as the given query (e.g. palafin → palafin-zero, palafin-hero).
   * Empty array if the species cannot be resolved.
   */
  listFormSlugsForPokemonQuery(rawSlug: string): Promise<string[]>;
};
