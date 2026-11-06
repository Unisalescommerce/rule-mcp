# 114: The fix tool and command apply the deterministic guardrails, not the file tree

- **Date**: 2026-09-23
- **Status**: accepted
- **Tags**: tools, commands, guardrails
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule_tool_fix existed in the code but was never registered: registerFixTool was called from nowhere, so `rule-mcp fix` and the doctor fix answered Unknown tool, and the tool was absent from the surface map. ADR 107 removed the scaffold, component and a11y-report tools but left fix, so its absence was an oversight, not a decision. The tool s old job was file-tree lint/fix: barrels, _PascalCase naming, generated component folders.

## Decision

1. rule_tool_fix is registered again, through registerActionTools, with new job: apply deterministic guardrail fixes every skill owns - blank lines, braces, single-line bodies, ASCII typography, American spelling - to changed files or explicit list, in lint (report) or fix (write) mode. 2. /rule-fix command mirrors it, on /rule-check pattern: fix deterministically, then call rule_tool_check for findings that need judgment. 3. passes live in core/guardrails/fix/, shared with scripts/fix so tool, script and command cannot drift; directory is documented counterexample catalog because it quotes patterns it fixes. 4. file-tree lint/fix/generate modes are gone; file-tree drift is reported by rule_tool_check with rule-styleguide-file-tree, and its repairs are judgment calls.

## Consequences

surface is 107 tools and 40 commands. CLI fix command and doctor fix work again. split is explicit: machine settles mechanical findings, model spends its turns on ones that need judgment. Cost: file-tree auto-fix (rename unprefixed component, create missing barrel) no longer exists as tool; run reads check report and edits by hand.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave rule_tool_fix unregistered and delete CLI fix and doctor fix (rejected: file-tree fix capability was intended, and its absence broke documented command).
1. Keep file-tree job and add second tool for guardrail fixes (rejected: two tools for one verb, and file-tree job has no deterministic fixer left).
