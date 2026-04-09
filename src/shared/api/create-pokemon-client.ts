import { PokemonClient } from 'pokenode-ts';

/** Factory for pokenode-ts PokemonClient (keep usage inside Data layer). */
export function createPokemonClient(): PokemonClient {
  return new PokemonClient({
    logs: __DEV__,
    cacheOptions: {
      ttl: 1000 * 60 * 60 * 6,
    },
  });
}
