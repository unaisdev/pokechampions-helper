# ADR 0002: Expo prebuild and Dev Client

## Status

Accepted

## Context

The app uses native capabilities (camera today; on-device ML later). Pure Expo Go is insufficient for all native modules we plan to ship.

## Decision

Use **Expo with continuous native generation** (`expo prebuild`) and **expo-dev-client** for day-to-day development on physical devices and simulators when native code is involved. Avoid ejecting to a fully manual Bare repo unless a plugin gap forces it.

## Consequences

- Developers run `npx expo run:ios` / `run:android` after native config changes.
- CI and docs must mention Node/Xcode/Android toolchain versions.
