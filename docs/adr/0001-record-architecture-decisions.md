# ADR 0001: Record architecture decisions

## Status

Accepted

## Context

The team needs a lightweight, traceable way to capture why important technical choices were made, so future contributors avoid re-litigating settled topics.

## Decision

Use Architecture Decision Records (ADRs) in `docs/adr/`, one markdown file per decision, numbered sequentially. Each ADR states context, decision, and consequences. Supersede with a new ADR instead of editing accepted history.

## Consequences

- Onboarding and reviews can link to a single document per topic.
- Some overhead when introducing new native dependencies or data strategies.
