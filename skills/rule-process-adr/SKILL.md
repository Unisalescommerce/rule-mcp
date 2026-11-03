---
name: rule-process-adr
description: >-
  Use when recording architecture decisions. Covers auto-numbered ADRs with Nygard template, searchable index, and chronological ordering.
tags:
  - architecture
  - documentation
  - decisions
  - adr
frameworks: [all]
guardrails:
  - adr-file-naming
  - adr-status-vocabulary
  - adr-author-line
  - adr-ends-when
  - adr-index-derived
  - adr-english
---

# rule-process-adr - Architecture Decision Records

## Purpose

Capture every architectural decision with its context, rationale and the
observation that would make it wrong. An ADR lives in `docs/adr/`, is immutable
once accepted, and is superseded by a new record that names it.

## The five conventions

These are rules of the house, not preferences. `rule_tool_check` reads them.

1. **Every record ends with `## What would end this`**: the observation that
   would make the decision wrong. A decision with no stated limit is never
   revisited.
2. **The author is a person or a team**, written as `Name <email>`. The serving
   tool is never the author, because nobody can ask it why.
3. **Numbering is three digits and allocated at write time.** Off the trunk a
   record is pending: it carries a slug and is numbered when it lands (ADR 196).
4. **A supersede is explicit in both directions.** The old record gains
   `- **Superseded by**: [NNN]`, the new one gains `- **Supersedes**: [NNN]`;
   the tool refuses a `superseded` record that names no successor.
5. **Title, slug and body are English**, in American spelling. The tool refuses
   a non-English write, and the rule explains a record that arrived another way.

## When to record one

Record a decision when a later reader would otherwise ask "why is this like
this?" and the answer is not in the code:

- a technology, storage or transport choice a future change would revisit;
- a constraint accepted on purpose, with the cost named;
- a rule the project enforces, so the next person knows it was a decision and
  not an accident.

Do not record a change that the diff already explains. An ADR is a record of a
choice, not a changelog entry.

## How to write it

`generateAdr` writes exactly this shape; the fields in the header are parsed by
the six rules, so the order matters:

```markdown
# 123: Use PostgreSQL as the primary database

- **Date**: 2026-11-03
- **Status**: accepted
- **Supersedes**: [098]
- **Tags**: database, architecture
- **Author**: Ada Lovelace <ada@example.com>

## Context

The service needs relational integrity across four tables and one migration path.

## Decision

Adopt PostgreSQL 16, one instance per environment, with migrations in the repository.

## Consequences

One database to operate and back up; horizontal write scaling is out of scope.

## What would end this

Sustained write volume above what one primary can hold, or a second team needing
a different availability window.

## Alternatives Considered

1. SQLite, rejected: no concurrent writers across services.
2. MySQL, rejected: the team's operational runbook already covers PostgreSQL.
```

`## What would end this` is mandatory; the other sections have defaults the tool
fills, and a default is not a decision.

## Superseding a decision

The record is immutable, so a reversal is two edits:

1. write the new ADR with `--supersedes 098`, which puts `- **Supersedes**: [098]`
   in its header;
2. edit record 098 by hand to `- **Status**: superseded` and add
   `- **Superseded by**: [123]`.

The old record keeps its body: what was believed then is evidence, not an error.
`deprecated` is for a record that still describes reality but should not be
followed for new work.

## What makes it wrong later

Review a record when the observation in `## What would end this` happens, when a
dependency it names is replaced, or when the next decision contradicts it. The
repair is always a new ADR plus the two-way supersede, never an edit to the
accepted text.

## Tools

### MCP tool: `rule_tool_process_adr`

```json
{
  "title": "Use PostgreSQL as the primary database",
  "status": "accepted",
  "context": "The service needs relational integrity across four tables.",
  "decision": "Adopt PostgreSQL 16, one instance per environment.",
  "consequences": "One database to operate; write scaling is out of scope.",
  "endsWhen": "Write volume above what one primary can hold.",
  "alternatives": ["SQLite, rejected: no concurrent writers"],
  "supersedes": "098",
  "tags": ["database", "architecture"]
}
```

The call is gated by `RULE_MCP_ADR_POLICY`: `handoff` by default, so a mid-task
write needs `moment: "handoff"` or the policy set to `full`.

### CLI: `rule-mcp adr new <title>`

```
--status <s>        proposed | accepted (default) | deprecated | superseded
--context <text>    forcing factors
--decision <text>   what was decided and why
--consequences <text>
--ends-when <text>  the observation that would make the decision wrong
--alternatives <text>  an alternative considered (repeatable)
--supersedes <n>       three-digit number this record replaces
--superseded-by <n>    three-digit number that replaces this record
--tags <list>       comma-separated, default architecture
```

## Directory and index

```
docs/adr/
├── ADR.md                       # generated: index, one-liners, themes, rules
├── 001-initial-architecture.md
├── 002-database-selection.md
└── _pending/                    # off-trunk: slug only, numbered at landing
```

`ADR.md` is the only index and nobody edits it. Every column is read back out of
the numbered files, so the repair is to fix the record and let the next write
rewrite the index.

## Status flow

```
proposed -> accepted -> deprecated
                |
                v
        superseded (names its successor)
```

---

## See also

- [rule-mcp](../rule/SKILL.md) - Central skill index and dispatcher
- [rule-process](../rule-process/SKILL.md) - Process skill index
