# Local development

## Metro

- `npm start` — Expo dev server; scan QR with Expo Go **only** for JS-only experiments.
- Camera and other custom native modules: use **`npx expo run:ios` / `run:android`** after `expo prebuild` has generated native projects (first run may take longer).

## Environment

- No production secrets are required for the MVP (PokéAPI is public).
- If you add `EXPO_PUBLIC_*` variables later, document them here and in `app.config` / `app.json` as appropriate.

## Native changes

After editing `app.json` plugins or adding native dependencies:

```bash
npx expo prebuild --clean
```

Use with care; review diffs in `ios/` and `android/`.

## Debugging

- React Native debugger / Expo dev tools as per [Expo debugging docs](https://docs.expo.dev/debugging/runtime/).
- For PokéAPI issues, log network errors in the repository layer only in dev builds.
