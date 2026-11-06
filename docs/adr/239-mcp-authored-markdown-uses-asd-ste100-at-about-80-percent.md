# 239: MCP-authored Markdown uses ASD-STE100 at about 80 percent

- **Date**: 2026-10-31
- **Status**: accepted
- **Tags**: writing, ste100, plans, directive, documentation
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The MCP server helps create many Markdown documents: plans, reviews, audits, ADRs, handoffs, persona sync output, and related prose. Without a shared writing rule, each generator invents its own tone. Long sentences, synonym churn, and stacked hedges make AI-assisted execution slower and harder to check. Development plans also needed a conflict-free shape (workstreams, tasks, dual dependency graph) so agents do not overlap file ownership. Tree walks such as file-tree could invent findings from gitignored noise.

## Decision

Adopt ASD-STE100 style at about 80 percent for MCP-authored technical Markdown. Prefer short sentences, active voice, one idea per sentence, and the same word for the same thing. Keep about 20 percent natural tone so the text does not sound robotic. Ship a documented subset of STE100 rules in src/core/directive (WRITING_DIRECTIVE / STE100_ANCHOR) and wire it into impersonation, personas, ADR and handoff writers, and related skill surfaces. Require AI-assisted development plans to use WSn / WSn-Tx.y with a parseable dependency list and a fenced diagram (ADR 154 amendment 2026-10-31; scanner in src/core/plans/_shape.js). Honor .gitignore on file-tree walks via src/core/ignore; leave tokensave, census, and security evidence walks on the evaluate matrix as defer or must-not.

## Consequences

Generators share one directive string; contract tests can reject banned patterns. Plan shape gates fail when WSn ids or the diagram fence are missing. File-tree ignores gitignored paths under src. Cost: historical docs are not rewritten in one pass; STE100 is a subset without a licensed dictionary; tokensave ignore policy stays deferred.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Require full licensed STE100 dictionary compliance (rejected: not available as a free dependency and would force robotic prose)
1. Leave writing style to each skill with no shared module (rejected: drift across impersonation, ADR, handoff)
1. Ignore gitignore everywhere and rely on hardcoded IGNORE_DIRS only (rejected: project-local ignored noise still creates false findings in file-tree)
