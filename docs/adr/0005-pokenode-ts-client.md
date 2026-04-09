# ADR 0005: pokenode-ts as PokéAPI client

## Status

Accepted

## Context

The app needs typed access to PokéAPI v2. Hand-written `fetch` plus manual types add boilerplate and drift risk.

## Decision

Use **[pokenode-ts](https://github.com/Gabb-c/pokenode-ts)** (`PokemonClient`) as the only production HTTP client for PokéAPI, constructed in `src/shared/api/create-pokemon-client.ts` and consumed only through `PokemonRepository` implementations.

## Consequences

- Dependency maintenance follows the upstream library; if it stalls, swap the repository implementation while keeping the `PokemonRepository` port.
- Peer dependencies (`axios`, `axios-cache-interceptor`) must stay compatible with React Native builds.
