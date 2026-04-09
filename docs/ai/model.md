# On-device ML / name detection

## Current state (MVP)

- **No OCR model is bundled yet.** The battle scan screen uses **manual name entry** to validate the PokéAPI pipeline.
- Domain placeholder: `DetectionResult` in `src/entities/detection-result.ts`.

## Planned direction

- **Primary:** On-device text recognition (e.g. ML Kit Text Recognition) on the captured image, plus normalization and fuzzy matching against an allowed name list aligned with PokéAPI slugs.
- **Fallback (if needed):** Scoped visual classifier (TFLite) for a limited roster—not full national dex in v1.

## Documentation obligations (when ML ships)

- Model / pipeline version, supported languages and game UI assumptions.
- Known failure modes (glare, fonts, localization).
- How to regenerate lexicon or calibration assets (scripts + checksums).

See [ADR 0003](../adr/0003-on-device-ocr-vs-classifier.md).
