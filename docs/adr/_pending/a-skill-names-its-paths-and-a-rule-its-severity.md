# Pending: A skill names its paths and a rule its severity

- **Date**: 2026-11-09
- **Status**: accepted
- **Tags**: guardrails, skills, frontmatter, project-scope
- **Author**: ftUNS <francesco.triozzi@unisales.eu>

## Context

A path-routed check picks one skill from the file extension (skillForPath), so a project skill in .rule-mcp/skills/ reaches a file only when a caller names it. A rule about supabase/migrations/** or AGENTS.md has no way to say where it applies. And every rule that fails, fails the check: only the project and semantic families have advisory findings, so a merge script cannot tell a finding that stops a merge from one it should only report.

## Decision

The SKILL.md frontmatter takes two optional keys. paths is a list of globs relative to the project root; a path-routed check sends a file to the skill its extension picks and then to every skill whose globs match (skillsForPath in cli/guard/_route.js, matched with node:path matchesGlob). severity is block or warn and is the default of the skill's rules; a rule object can carry its own severity, which wins. The loader stamps the resolved severity on each rule. checkCode puts a failing warn rule in a new advisory list with advisoryCount, outside failed, so it never fails the check; every finding carries its severity. A check that names a skill still runs it on any file: paths routes, it does not filter an explicit call. An unknown severity value is reported and blocks.

## Consequences

No skill in the catalog declares either key, so every existing check answers as before; failed entries gain a severity field and the result gains advisory and advisoryCount, both additive. A project skill can now target a directory without a caller naming it, and a gate can separate block from warn. rule_tool_check prints warn findings under the failures. The commit hook routes through skillsForPath, but its process does not install the skill rules or paths today, so in practice the hook does not see path skills yet; that is a separate, existing gap.

## What would end this

Skills need exclusion globs or per-rule paths, or a severity level between warn and block shows up in practice.

## Alternatives Considered

1. A severity map in .rule-mcp/config.json: it lets a project re-grade catalog rules too, and it splits a rule's definition from its grade; it can be added on top of this later.
1. paths as a filter on every check, explicit calls included: a caller that names a skill on purpose would get an empty answer with no reason.
1. A glob dependency such as picomatch: node:path matchesGlob is in the runtime floor (Node 24) and the repository adds no runtime dependency for what the platform does.
