# PokeChampions Helper

Expo app (React Native + TypeScript) to photograph a Pokémon battle summary, detect the Pokémon name (on-device OCR on the roadmap), and show basic stats from [PokéAPI](https://pokeapi.co/) via [pokenode-ts](https://github.com/Gabb-c/pokenode-ts).

## Requirements

- Node.js **≥ 20.19.4** (recommended; Expo SDK 54)
- **Yarn** with [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable` once) — see [docs/guides/setup.md](docs/guides/setup.md)
- Xcode / Android Studio for native builds with `expo prebuild`

## Development

```bash
corepack enable   # once per machine
yarn install
yarn start
```

With native modules (camera, dev client), use a device or simulator:

```bash
npx expo run:ios
# or
npx expo run:android
```

## Scripts

| Script                 | Description                 |
| ---------------------- | --------------------------- |
| `yarn start`           | Metro + Expo                |
| `yarn lint`            | ESLint (Expo flat config)   |
| `yarn typecheck`       | TypeScript (`tsc --noEmit`) |
| `yarn format`          | Format with Prettier        |
| `yarn format:check`    | Verify Prettier formatting  |

## Documentation

Technical docs (English): [docs/README.md](docs/README.md).

## Project layout

- `app/` — Expo Router routes
- `src/entities` — domain models
- `src/shared/api` — PokéAPI client and repository
- `src/features/battle-scan` — scan screen

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
