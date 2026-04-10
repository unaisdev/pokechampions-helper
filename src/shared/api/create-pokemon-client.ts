import { MainClient } from 'pokenode-ts';

/** Factory for pokenode-ts MainClient (Pokémon + movimientos; `PokemonClient` no expone `/move`). */
export function createPokemonClient(): MainClient {
  return new MainClient({
    logs: __DEV__,
    cacheOptions: {
      ttl: 1000 * 60 * 60 * 6,
    },
  });
}
