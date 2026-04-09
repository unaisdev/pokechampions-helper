# Release process

## Versioning

- Use **semantic versioning** for app releases (`app.json` / `expo.version`).
- Tag Git releases to match store builds when applicable.

## Checklist (manual)

1. `npm run lint`, `npm run typecheck`, `npm run format:check`.
2. Test on **real devices** (camera path).
3. Update release notes (store + optional `CHANGELOG.md` if introduced).
4. Bump version in `app.json`.
5. Build with **EAS Build** or local `eas build` when configured (document profiles here when added).

## Rollback

- Revert the offending commit on `main` and ship a patch version, or roll back staged rollout in App Store Connect / Play Console per platform policy.

## Native upgrades

- When bumping Expo SDK or React Native, run full regression on camera and AsyncStorage cache; note breaking changes in the release notes.
