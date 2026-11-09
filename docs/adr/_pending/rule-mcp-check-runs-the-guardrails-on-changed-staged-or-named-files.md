# Pending: rule-mcp check runs the guardrails on changed, staged or named files

- **Date**: 2026-11-09
- **Status**: accepted
- **Tags**: cli, guardrails, ci, gate
- **Author**: ftUNS <francesco.triozzi@unisales.eu>

## Context

The guardrails reach a project through the MCP tool, which an agent calls on a snippet, and through the hooks, which never deny (ADR 121). A merge script or a CI job has no way to run the same rules on the files of a change and act on the result: rule-mcp fix --mode lint reports what the fixers would change, not what the rules find, and the commit hook answers a host, not a shell.

## Decision

A new command, rule-mcp check, takes exactly one file source: --changed (files that differ from the merge base with --base, HEAD by default, in the working tree, plus untracked files), --staged (the files added, copied, modified or renamed in the index, read from the index; not with the commit hook's helpers, which swallow a git failure so the hook never denies) or --files (a comma list relative to the project root). It installs the skill layers and .rule-mcp/config.json for the project root found from --dir, lists paths relative to that root, so a project in a subdirectory of its repository matches its paths globs, routes each file with skillsForPath, and runs checkCode, the engine every other surface runs. It prints one line per finding, or with --json a stable array of { skill, rule, severity, file, detail, suggestion }. A rule two routed skills share is reported once, as block when either skill grades it block. Exit 0 when no finding has severity block, 1 when one does, 2 when the check could not run: no single source, not a git repository, a git command that fails, a file that cannot be read. Problems loading the project and user layers go to stderr; problems in the bundled catalog do not, because the project cannot fix them.

## Consequences

A gate outside the agent can run the same rules the agent sees, and decide on severity instead of parsing text. The hooks keep their never-deny design: the command is a separate, explicit entry point. The output has no line numbers because rules report a detail list and no position; a line field can be added without breaking a consumer. Exit 2 keeps a check that did not run from reading as a clean one, the same contract as rule-mcp secrets.

## What would end this

Rules start reporting positions, which calls for a line field and probably SARIF, or the hooks gain an opt-in mode that makes a separate gate command redundant.

## Alternatives Considered

1. A --gate flag on rule-mcp fix --mode lint: fix reports the deterministic fixers, not the rules, and mixing the two answers would make neither exit code mean one thing.
1. Call rule_tool_check through rule-mcp tools call per file: one process per file, text output meant for a model, and no routing by path or severity.
1. Exit with the number of findings: shells truncate exit codes at 255, and a warning count would turn a passing check into a failing one.
