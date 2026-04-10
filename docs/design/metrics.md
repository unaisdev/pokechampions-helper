# Design metrics (typography, spacing, radii)

This document describes the **de facto UI scale** used across the app today, mainly in `src/features/battle-scan/ui/` and related screens. Values are in **logical pixels** (React Native’s density-independent units).

Use it when adding screens, tuning Unistyles themes, or refactoring duplicated literals into shared tokens.

---

## Typography

| Token (semantic) | Typical `fontSize` | Usage in app |
| ---------------- | ------------------ | ------------ |
| **Display / hero** | 20–22 | Screen titles, large headings (`BattleScanScreen`, compare modal headings) |
| **Modal title** | 17–18 | Sheet headers, primary modal titles |
| **Section / emphasis** | 15–16 | Buttons, key labels, emphasized body |
| **Body** | 13–15 | Default paragraph and list text |
| **Secondary** | 12–14 | Supporting lines, subtitles |
| **Caption / meta** | 10–12 | Badges, hints, move names in compact rows |
| **Micro** | 10–11 | Fine print, tiny labels (e.g. stat footnotes) |

**Letter spacing:** `letterSpacing: 0.4` appears on some uppercase or small-caps style labels (e.g. chips). Use sparingly.

**Font family:** `SpaceMono` is loaded in the root layout for monospace needs; most UI uses the system default sans-serif.

---

## Spacing scale

The codebase gravitates toward a **4 px grid** (multiples of 4, with occasional 2 / 6 / 10 for tight UI).

| Step | Value | Typical use |
| ---- | ----- | ------------- |
| `xxs` | 2 | Icon-to-text nudge, hairline vertical gaps |
| `xs` | 4 | Tight stacks, small margins between related lines |
| `sm` | 6–8 | Inline gaps, padding inside small chips |
| `md` | 10–12 | Default vertical spacing between blocks, `gap` in rows |
| `lg` | 14–16 | Screen horizontal padding, card inner padding |
| `xl` | 18–20 | Large card padding, modal padding variants |
| `xxl` | 24+ | Section separation (e.g. `marginTop: 24`) |

**Screen edges:** horizontal padding is often **14–16**; vertical padding on scroll content frequently ends with **28–40** at the bottom to clear home indicators / tab bars.

**Safe areas:** modals use `paddingTop: Math.max(insets.top, 8)` and `paddingBottom: Math.max(insets.bottom, 12)` (or similar) so content clears notches and the home indicator.

---

## Border radius

| Approx. token | Value | Usage |
| ------------- | ----- | ----- |
| **Hairline / stat pip** | 3 | Tiny squares (e.g. EV bars, micro indicators) |
| **Small** | 6–8 | Inner pills, small buttons, nested surfaces |
| **Medium** | 10–12 | Cards, primary buttons, sheet sections |
| **Large** | 14 | Modal containers, prominent panels |
| **Pill** | 999 (or very large) | Fully rounded chips / filters |

`StyleSheet.hairlineWidth` is used where a **1-device-pixel** divider is needed (list separators).

---

## Touch targets & interactive rows

- Vertical padding on tappable rows is often **10–14** with horizontal padding **12–16**.
- Icon-only or compact actions sometimes use **paddingVertical: 6–8** and **paddingHorizontal: 8–10**; ensure the hit area still meets ~44 pt where possible (platform guideline).

---

## Layout patterns

| Pattern | Common values |
| ------- | ------------- |
| **Card** | `padding` 10–16, `borderRadius` 10–12, `marginBottom` 8–16 |
| **Modal sheet** | Outer `padding` 16–18, corner `borderRadius` 14, header `fontSize` 17–18 |
| **List row** | `paddingVertical` 8–12, horizontal 14–16, row `gap` 8–10 |
| **Tab / bottom bar** (compact team) | `paddingVertical` 12, horizontal 8, `borderRadius` 10 |

---

## Color & theme (today)

Global navigation theming uses `@react-navigation/native` `DefaultTheme` / `DarkTheme` in `app/_layout.tsx`. Feature screens often define **local palettes** (e.g. Pokédex-inspired reds/yellows on the info tab) or hardcoded light/dark pairs per component.

When centralizing with **Unistyles** (or another theme provider), map the scales above to theme keys such as `fontSizes.*`, `spacing.*`, and `radii.*` so light/dark only swap colors, not structural metrics.

---

## Maintenance

- **Single source of truth (future):** consider exporting these scales from `src/shared/theme/tokens.ts` (or similar) and consuming them from `StyleSheet` or Unistyles.
- **After large UI changes:** update this table if new dominant sizes appear (search for `fontSize:`, `padding`, `borderRadius` in `src/features/`).
