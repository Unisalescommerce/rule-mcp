# 131: Extend the data guardrail family with shared and per-engine rules

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: guardrails, data, database, quality-gate
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Eight rule-data skills exist and only rule-data owns guardrails: connection-pool, migration-safety, parameterized-queries and transaction-safety, inherited by seven children. engines add concerns none of four covers: PostgreSQL does not auto-index foreign keys, MongoDB cursors need projection and ESR-ordered compound index, SQLite needs WAL and busy timeout, and application queries should not use SELECT star or run without limit or statement timeout.

## Decision

Add nine rules split by owner: shared in rule-data (no-select-star, query-limit, query-timeout, db-least-privilege, migration-down), in rule-data-postgresql (index-on-fk), in rule-data-mongodb (mongo-projection, mongo-esr-index) and in rule-data-sqlite (sqlite-wal). Rules ship advisory and are promoted to blocking after the corpus gate reports full precision and recall. Two questions stay open: the MySQL reference manual is unreachable from this environment, and the ownership table for each rule needs confirmation.

## Consequences

Positive: the data family covers indexing, projection, limits and timeouts, and each rule cites PostgreSQL, MongoDB, SQLite or OWASP documentation. Negative: engine rules need fixtures per engine; mysql and sql stay on the shared set only; MySQL-specific claims wait for an accessible source.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Only tighten four existing rules and add no id
1. Put every rule in rule-data and give engine skills no guardrails of their own
1. Add MySQL-specific rules without verified source
