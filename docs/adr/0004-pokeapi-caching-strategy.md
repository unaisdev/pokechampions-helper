# ADR 0004: PokéAPI caching strategy

## Status

Accepted

## Context

[PokéAPI](https://pokeapi.co/) is rate-limited and may be slow or unreachable. Species data changes rarely; the app should work offline for previously fetched Pokémon.

## Decision

Use **two levels of caching**:

1. **In-memory / request cache** via `axios-cache-interceptor` options passed to **pokenode-ts** `PokemonClient` (session-scoped, fast repeat lookups).
2. **Persistent cache** in `PokemonRepository` using **AsyncStorage**, keyed by normalized species name, storing a mapped `PokemonSummary` JSON.

## Consequences

- Cache invalidation is coarse (e.g. app version bump or manual clear); acceptable for static Pokédex data.
- Repository remains the single place screens ask for Pokémon data.
