# 024: The tool surface is ./skills and nothing else

- **Date**: 2026-08-04
- **Status**: accepted
- **Tags**: architecture
- **Author**: rule-mcp-architect

## Context

`getSkillNames()` merged `~/.agents/skills` with bundled `skills/` tree, and any directory holding `SKILL.md` became callable tool under `rule_tool_` prefix regardless of its name.

On machine that ran 2026-08-04 audit this exposed **176 tools instead of 88**:

- **79 stale `rule-mcp-*` directories** from previous brand resurfaced as duplicated `rule_tool_frontend_react` tools - functional duplicates of `rule_tool_*` set that this repository does not ship;
- **9 generic third-party skills** were renamed into namespace (`rule_tool_test_driven_development`, `rule_tool_compress`, `rule_tool_find_skills`, `rule_tool_frontend_design`).

Measured cost: 216,102 bytes of tool schemas per model turn, roughly **54k tokens**, about half of it foreign.

Two further consequences of reading home directory:

- `readSkill()` searched home directory **first**, so directory in user's home silently replaced content this server ships under same tool name;
- `loadPluginJs()` imported `plugin.js` from that same home directory into server process at startup, with no isolation and failures swallowed (audit finding 15).

## Decision

bundled `skills/` directory is single source of truth for tool surface.

- `getSkillNames()` scans only `skills/`, accepts only directories named `rule-mcp-*` that carry `SKILL.md`, and excludes bare `rule-mcp` router directory - its tool is dispatcher, registered by code.
- `readSkill()` reads only `skills/`, so embedded content is authoritative and cannot be shadowed.
- `plugin.js` import path is removed: `hasPluginJs()` is constant `false` and `loadPluginJs()` is gone, which also removes in-process code execution from user's home directory.
- `rule://skills` resource index reads same single source.
- `isPluginSkill()` is kept as explicit guard even though it can no longer be true for registered skill.

## Consequences

- Custom and third-party skills in `~/.agents/skills` are no longer served by this server, and neither are plugin guardrails from `plugin.js`. This **supersedes the "User control" and "plugin system" points of ADR 003 and ADR 008**.
- `scripts/install-skills.mjs` and `skills:install` CLI still copy bundled skills into `~/.agents/skills`, where server now ignores them. That command needs decision of its own - it is now no-op with misleading success message.
- Measured effect on audited machine: **176 -> 88 tools**, **216,102 -> 105,190 bytes** (≈54k -> ≈26k tokens per turn), taken while 79 `rule-mcp-*` directories were still on disk. surface is now property of code, not of machine.
- `test/minimal-tools.test.mjs` asserted "more than 90 tools" - threshold that only held because of inflated surface and would have failed on clean checkout. It now derives expected count from `skills/` on disk.
- Covered by `test/skill-surface-embedded-only.test.mjs`, which also proves home copy cannot shadow embedded content and that `plugin.js` in home directory is never imported.
