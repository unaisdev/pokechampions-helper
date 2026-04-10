# Setup

## Prerequisites

- **Node.js** ≥ 20.19.4 (see root `.nvmrc`)
- **Yarn** — this repo standardizes on Yarn (Classic 1.x); lockfile: `yarn.lock`
- **Corepack** (ships with Node) so the `yarn` binary matches `package.json` → `packageManager`
- For native builds: **Xcode** (iOS), **Android Studio** / SDK (Android)

### Package manager: Yarn + Corepack

The `packageManager` field in `package.json` pins the Yarn version. Enable Corepack once per machine so `yarn` is not confused with an old global install:

```bash
corepack enable
```

Then install dependencies with **`yarn`** (not `npm` or `pnpm`) so the lockfile stays consistent.

## Install

```bash
git clone https://github.com/unaisdev/pokechampions-helper.git
cd pokechampions-helper
corepack enable   # once per machine
yarn install
```

## Verify

```bash
yarn lint
yarn typecheck
yarn format:check
```

## Run the app

```bash
yarn start
```

For features that need native modules (camera, dev client), use a development build:

```bash
npx expo run:ios
# or
npx expo run:android
```
