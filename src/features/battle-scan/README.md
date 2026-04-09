# Feature: battle scan

## Purpose

Capture a photo of the in-game battle summary, resolve the Pokémon name (manual input until OCR lands), and show stats via `PokemonRepository`.

## Entry

- Tab **Escanear** → `app/(tabs)/index.tsx` → `BattleScanScreen`.

## Dependencies

- `expo-camera` — preview and still capture.
- `@src/shared/api` — `defaultPokemonRepository`.

## Related docs

- [docs/ai/model.md](../../../docs/ai/model.md)
- [docs/architecture/overview.md](../../../docs/architecture/overview.md)
