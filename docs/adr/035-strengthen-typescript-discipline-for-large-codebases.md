# 035: Strengthen TypeScript discipline for large codebases

- **Date**: 2026-08-02
- **Status**: accepted
- **Tags**: typescript, toolchain, strict, monorepo, quality
- **Author**: rule-mcp-architect

## Context

The OpenReplay article proposes useful practices for maintaining refactorability and type safety in large TypeScript projects: additional strict flags, domain types, generated contracts, runtime validation, project references, and CI guardrails.

## Decision

Update rule-toolchain-typescript with exactOptionalPropertyTypes, verbatimModuleSyntax, explicit strict checks, incremental migration, discriminated unions, branded types, unknown, boundary validation, generated types, project references, and type-coverage ratcheting. Statements tied to TypeScript 6/7 remain version-gated and don't become baseline dependencies.

## Consequences

skill provides safer baseline for large codebases and makes explicit difference between compile-time and runtime guarantees; enabling exactOptionalPropertyTypes may need call site migration.

## Alternatives Considered

1. Limit to adding two missing strict flags
1. Create separate skill for TypeScript large projects
1. Adopt future versions and defaults from article without qualifications
