# Coding guidelines

Supplements [CONTRIBUTING.md](../../CONTRIBUTING.md).

## TypeScript

- `strict` mode on; avoid `any`.
- Prefer explicit return types on public exports when not obvious.

## Imports

- Expo template paths: `@/` → project root.
- New domain and feature code: `@src/…` (see `tsconfig.json` paths).

## React Native / Expo

- Keep route files under `app/` thin; move UI to `src/features`.
- Prefer hooks and small components over large monolithic screens.

## PokéAPI

- Do not import `PokemonClient` directly from screens; use `PokemonRepository`.

## Errors

- Throw / return domain errors from `src/shared/lib/errors.ts` where appropriate; map to user-visible strings in UI (i18n later).

## Formatting

- Run `npm run format` before pushing; CI runs `npm run format:check`.
