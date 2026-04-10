import type { MainClient } from 'pokenode-ts';

/**
 * PokéAPI language resource — localized `names[]` on species, moves, types, etc. use the same
 * `language.name` as GET `/api/v2/language/{id or name}/`. Pass a client from `createPokemonClient()`.
 * @see https://pokeapi.co/docs/v2#languages-section
 */
export async function fetchPokeApiLanguageByName(client: MainClient, name: string) {
  return client.utility.getLanguageByName(name);
}

export async function fetchPokeApiLanguageById(client: MainClient, id: number) {
  return client.utility.getLanguageById(id);
}
