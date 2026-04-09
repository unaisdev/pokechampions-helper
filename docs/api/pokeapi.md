# PokéAPI integration

## Base URL

Default: `https://pokeapi.co/api/v2/` (used by **pokenode-ts** unless overridden).

Official docs: [PokéAPI v2](https://pokeapi.co/docs/v2).

## Client library

- **Package:** [pokenode-ts](https://github.com/Gabb-c/pokenode-ts)
- **Construction:** `createPokemonClient()` in `src/shared/api/create-pokemon-client.ts`
- **Consumption:** only through `PokemonRepository` (e.g. `PokemonRepositoryPokenode`)

## Endpoints used (MVP)

| Method | Endpoint (conceptual) | Usage                                                         |
| ------ | --------------------- | ------------------------------------------------------------- |
| GET    | `/pokemon/{name}`     | `PokemonClient.getPokemonByName` — sprites, types, base stats |

Additional endpoints (species flavor text, abilities detail, etc.) may be added for V2.

## Type icons

The `/type/{id}` JSON does **not** include image URLs. The app builds icon URLs from the **type id** embedded in each `pokemon.types[].type.url` and the static assets in [PokeAPI/sprites](https://github.com/PokeAPI/sprites) (generation VIII Sword/Shield **small** PNGs). See `parseTypeIdFromPokeApiUrl` and `pokeApiTypeIconUrl` in `src/shared/lib/type-sprites.ts`.

## HTTP behavior

- **User-Agent:** set via shared Axios defaults in the stack used by pokenode-ts where applicable; repository uses the client as provided.
- **Timeout:** configured on `PokemonClient` / cache layer (see implementation).
- **Errors:** 404 → `PokemonNotFoundError`; network failures → `PokemonNetworkError`.

## Rate limits

PokéAPI is a free shared service. Cache aggressively (see [ADR 0004](../adr/0004-pokeapi-caching-strategy.md)). Do not ship tight loops of uncached requests.
