# ADR 0003: On-device OCR vs visual classifier (MVP)

## Status

Accepted

## Context

The product goal is to obtain a **Pokémon name** from a photo of an in-game battle summary. Options include on-device OCR of UI text, a multi-class image classifier, or hybrid approaches.

## Decision

Prioritize **on-device OCR + normalization + lexicon / fuzzy match** against official names for the MVP path. Treat a **visual classifier** (e.g. TFLite) as optional or scoped to a small roster only if OCR quality is insufficient—full 900+ species classification is out of scope for the first MVP.

## Consequences

- OCR pipeline and locale/font issues must be documented and tested per target game UI.
- Training data and model export are deferred until a classifier is actually chosen.
