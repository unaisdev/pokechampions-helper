# Architecture overview

## Layers

| Layer                     | Responsibility                                     |
| ------------------------- | -------------------------------------------------- |
| `app/`                    | Expo Router routes and layouts; keep screens thin. |
| `src/entities/`           | Domain types (`PokemonSummary`, detection stubs).  |
| `src/shared/`             | API clients, repositories, shared utilities.       |
| `src/features/<feature>/` | Feature-specific UI and orchestration.             |

## Data flow (MVP)

1. User captures a battle summary photo (`expo-camera`).
2. Name resolution will use on-device OCR (planned); today the screen accepts manual input.
3. `PokemonRepository` resolves the species: **AsyncStorage** cache first, then **PokéAPI** via **pokenode-ts** (`PokemonClient`).
4. UI renders `PokemonSummary` (types, base stats, sprite).

## Dependencies

- **Expo SDK 54** with **prebuild** when native modules change (camera, future ML).
- **expo-dev-client** for development builds that include native code.

See ADRs under [docs/adr/](../adr/) for recorded decisions.
