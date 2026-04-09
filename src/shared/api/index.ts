import { createPokemonClient } from './create-pokemon-client';
import { PokemonRepositoryPokenode } from './pokemon-repository-pokenode';

export { createPokemonClient } from './create-pokemon-client';
export { mapPokemonToSummary } from './map-pokemon-to-summary';
export type { PokemonRepository } from './pokemon-repository';
export { PokemonRepositoryPokenode } from './pokemon-repository-pokenode';

/** Default repository for screens; replace in tests via DI when needed. */
export const defaultPokemonRepository = new PokemonRepositoryPokenode(createPokemonClient());
