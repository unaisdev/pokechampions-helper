# Testing strategy

## Current

- **Lint + typecheck** in CI (`npm run lint`, `npm run typecheck`, `npm run format:check`).
- Snapshot test scaffold under `components/__tests__/` (template); expand deliberately.

## Near-term

- **Unit tests** for pure functions: name normalization, DTO → `PokemonSummary` mapping, error handling branches (Vitest or Jest—align with Expo when added).
- **Repository tests** with mocked HTTP (no live PokéAPI in CI).

## Later

- **E2E** (Maestro / Detox) for camera permission flows and end-to-end lookup—heavy; add when the UI stabilizes.

## Manual

- Always verify camera capture on a **physical device** before release.
