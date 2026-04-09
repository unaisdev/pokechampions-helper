# PokeChampions Helper

App Expo (React Native + TypeScript) para fotografiar un resumen de batalla Pokémon, detectar el nombre (OCR on-device en roadmap) y mostrar datos básicos vía [PokéAPI](https://pokeapi.co/) usando [pokenode-ts](https://github.com/Gabb-c/pokenode-ts).

## Requisitos

- Node.js **≥ 20.19.4** (recomendado; el proyecto usa Expo SDK 54)
- Xcode / Android Studio para builds nativos con `expo prebuild`

## Desarrollo

```bash
npm install
npx expo start
```

Con módulos nativos (cámara, dev client), en dispositivo o simulador:

```bash
npx expo run:ios
# o
npx expo run:android
```

## Scripts

| Script        | Descripción              |
| ------------- | ------------------------ |
| `npm start`   | Metro + Expo             |
| `npm run lint`| ESLint (Expo flat config)|

## Estructura

- `app/` — rutas Expo Router
- `src/entities` — modelos de dominio
- `src/shared/api` — cliente PokéAPI y repositorio
- `src/features/battle-scan` — pantalla de escaneo

## Licencia

Private (ajusta según tu organización).
