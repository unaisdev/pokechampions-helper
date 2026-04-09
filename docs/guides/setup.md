# Setup

## Prerequisites

- **Node.js** ≥ 20.19.4 (see root `.nvmrc`)
- **npm** (lockfile: `package-lock.json`)
- For native builds: **Xcode** (iOS), **Android Studio** / SDK (Android)

## Install

```bash
git clone https://github.com/unaisdev/pokechampions-helper.git
cd pokechampions-helper
npm install
```

## Verify

```bash
npm run lint
npm run typecheck
npm run format:check
```

## Run the app

```bash
npm start
```

For features that need native modules (camera, dev client), use a development build:

```bash
npx expo run:ios
# or
npx expo run:android
```
