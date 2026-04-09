# PokeChampions Helper

Expo app (React Native + TypeScript) to photograph a Pokémon battle summary, detect the Pokémon name (on-device OCR on the roadmap), and show basic stats from [PokéAPI](https://pokeapi.co/) via [pokenode-ts](https://github.com/Gabb-c/pokenode-ts).

## Requirements

- Node.js **≥ 20.19.4** (recommended; Expo SDK 54)
- Xcode / Android Studio for native builds with `expo prebuild`

## Development

```bash
npm install
npx expo start
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
| `npm start`            | Metro + Expo                |
| `npm run lint`         | ESLint (Expo flat config)   |
| `npm run typecheck`    | TypeScript (`tsc --noEmit`) |
| `npm run format`       | Format with Prettier        |
| `npm run format:check` | Verify Prettier formatting  |

## Documentation

Technical docs (English): [docs/README.md](docs/README.md).

## Project layout

- `app/` — Expo Router routes
- `src/entities` — domain models
- `src/shared/api` — PokéAPI client and repository
- `src/features/battle-scan` — scan screen

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
