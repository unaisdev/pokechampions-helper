import type { PokemonSummary } from '@src/entities/pokemon-summary';

export type PokemonRepository = {
  getByName(rawName: string): Promise<PokemonSummary>;
};
