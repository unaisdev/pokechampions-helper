# Contributing

Thanks for contributing to **PokeChampions Helper**. This document describes how we work in this repo so history stays clear and reviews stay focused.

## Requirements

- Node.js **≥ 20.19.4** (aligned with Expo SDK 54 / React Native)
- A GitHub account and access to the repository

## Local setup

```bash
git clone https://github.com/unaisdev/pokechampions-helper.git
cd pokechampions-helper
npm install
```

Verify the project passes basic checks:

```bash
npm run lint
npm run typecheck
npm run format:check
```

To run the app: `npm start`, then open in Expo Go or a development build (`npx expo run:ios` / `run:android`) when using native modules (camera, dev client).

## Workflow

1. Branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/short-descriptive-name
   ```

2. Make **small, focused commits** (one logical change per commit when possible).

3. Open a **Pull Request** into `main`. GitHub will load the PR template; fill it in with context and test steps.

4. Wait for review. Address feedback before merge.

### Branch naming (recommended)

- `feature/…` — new functionality
- `fix/…` — bug fix
- `chore/…` — tooling, dependencies, CI
- `docs/…` — documentation only

## Commit messages (Conventional Commits)

Use an English prefix followed by a short imperative description:

| Prefix      | Use                                         |
| ----------- | ------------------------------------------- |
| `feat:`     | User-visible feature or internal public API |
| `fix:`      | Bug fix                                     |
| `docs:`     | Documentation only                          |
| `chore:`    | Maintenance (deps, config, CI)              |
| `refactor:` | Internal change, same behavior              |
| `test:`     | Add or fix tests                            |

**Examples:**

```text
feat(scan): add loading state while fetching Pokémon
fix(api): handle empty name before PokéAPI call
chore: bump expo-camera to x.y.z
docs: document AsyncStorage cache keys
```

Optional: message body with detail or issue reference (`Closes #12`).

## Architecture and code

- **Strict TypeScript** — avoid `any` unless justified in review.
- **Layers:**
  - `app/` — routes and layouts (Expo Router); keep thin when possible.
  - `src/entities/` — domain types.
  - `src/shared/` — API, shared utilities, generic UI if needed.
  - `src/features/<feature>/` — feature-scoped logic and UI.
- **Imports:** the Expo template uses `@/` for the repo root; prefer `@src/…` for new domain code where appropriate.
- **PokéAPI:** keep access behind `PokemonRepository` and factories in `src/shared/api/`; do not scatter `PokemonClient` in screens.
- **Domain errors:** use types in `src/shared/lib/errors.ts` and map to UI copy in the presentation layer.

If you introduce a meaningful **architecture decision** (new native dependency, cache strategy, OCR, etc.), add or update an **ADR** under `docs/adr/` when that folder exists, or link it in the PR description until ADRs are in place.

## Pull requests

- A PR should cover **one coherent topic** (avoid mixing a huge refactor with a large feature).
- Fill in **how to test** with reproducible steps (platform, flow).
- For visual changes, attach **screenshots** or a short recording.
- Reply to review comments or resolve threads when you have applied the change.

## Review bar (maintainers)

- Correct behavior and no obvious regressions.
- Alignment with layers and existing conventions.
- No PII or secrets; dependencies with an acceptable license.

## Questions

Open a discussion issue or ask on the PR. For the public PokéAPI, see [PokéAPI v2](https://pokeapi.co/docs/v2) and [pokenode-ts](https://github.com/Gabb-c/pokenode-ts).
