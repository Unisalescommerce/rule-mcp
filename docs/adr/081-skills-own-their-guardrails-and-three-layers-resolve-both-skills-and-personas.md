# 081: Skills own their guardrails, and three layers resolve both skills and personas

- **Date**: 2026-09-12
- **Status**: accepted
- **Tags**: architecture, skills, guardrails, personas, extensibility
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Guardrails lived in src/core/guardrails/ as 98 files grouped by family, and engine/_registry.js composed them per skill by pattern-matching skill name. skill was markdown; rules that judge its subject lived somewhere else, so skill could not be moved, shared or extended without editing server. ADR 025 had closed every extension point for measured reason: merging ~/.agents/skills exposed 176 tools instead of 88 (216 KB of schemas per turn, about 54k tokens), let home directory shadow bundled content, and imported plugin.js from home directory into server process. role overlay system kept user layer but its project layer was removed on principle that nothing server reads comes from checkout. result was server that could not be extended per project at all.

## Decision

skill owns rules that judge its subject. Guardrails move into skills/`<name>`/guardrails/*.js as same { id, label, description, check } modules they already are, and SKILL.md frontmatter declares them: guardrails lists ids skill defines, inherits lists skills it takes rules from. Composition is inheritance rather than pattern-matching: rule-backend-express inherits rule-backend, rule-frontend-react inherits styleguide skills whose rules it needs. Resolution is depth-first with dedup by id and nearest definition wins, so child skill overrides rule it inherits. Skills and personas both resolve through three layers, loaded native then project then user, last wins, whole-entry override, with originating layer recorded on every entry: skills/ and personas/ bundled with server, `<projectRoot>`/.rule-mcp/{skills,personas} found by walking up from working directory to first.git or.rule-mcp, and ~/.rule-mcp/{skills,personas} for machine owner, who so has last word over any repository. src/roles becomes ./personas beside ./skills. custom skill declares exposeTool in its frontmatter, default false, so dropping folder in adds guardrails and searchable evidence without growing tool surface. Custom guardrail JS is imported without trust gate; worker thread with its timeout stays only guard. ~/.agents/skills is unrelated to all of this: it is where installer can copy skills for agents that read skills natively, offered as install mode that sets up no MCP server, and server never scans it.

## The baseline, and why it is not inherited

Thirty rules applied to every skill before this: the naming, prose, comment, simplicity and markup checks. They now live in the thirteen skills that own them by subject, and every check still includes them - but `BASELINE_SKILLS` in the engine names those thirteen rather than each of the ninety-one SKILL.md files declaring them.

reason is graph. baseline every skill inherits cannot also be set of skills that inherit baseline: that is cycle, and while resolver reports cycle and steps over it, declaration whose meaning depends on how resolver breaks it is not declaration anybody can read. alternative considered was each of thirteen inheriting other twelve, which is acyclic and explicit and also complete graph nobody would want to edit.

So: rules are distributed, which is what the skills own. Which skills are always on is one list, in one place, with the reason beside it.

## The helper surface: a rule imports nothing

Node resolves bare specifier by walking `node_modules` up from importing file. skill in project's `.rule-mcp/skills`, in user's own, or copied between machines has no `node_modules` above it, so anything rule imported failed to load and skill went silent. Measured, not assumed: rule importing helper resolved in this checkout and in no other layer.

So rule imports nothing. engine passes `context.helpers` on every check - eighteen functions covering verdicts, source reading, manifests and prose scanning - and rule file is plain module that resolves same wherever it was dropped.

published package was built and removed. It worked, and it cost package to version, workspace, resolve fallback for directories that still could not reach it, and dependency every skill author had to declare. Injection costs one destructuring line per rule and removes all of it.

The trade is that the helper list is a contract: adding to it is adding to what every skill on the machine is written against, so it is a decision rather than an import. A rule is also no longer runnable outside the engine without being handed a bag, which is the same statement said twice.

`@mcp/*` resolves to `./src/` through `module.registerHooks`, registered by every entry point that loads server code. That alias is for this server's own tree only: file using it is not runnable by bare `node`, which is exactly why it never appears in skill's guardrails.

## Consequences

project versions its own rules beside its code and team shares them through git. skill is portable: its SKILL.md names its rules and rules sit beside it, so same folder works bundled, in project, in home directory, or copied into ~/.agents/skills. cost is explicit and accepted: importing custom guardrail JS reinstates in-process execution of code from checkout and from home directory, which is exactly what ADR 025 removed for finding 15 of 2026-08-04 audit. This supersedes that part of ADR 025. Cloning repository and starting server now runs its guardrail code; worker timeout bounds runaway pattern but not hostile one. tool-surface half of ADR 025 stands, guarded differently: exposeTool defaults to false, so 176-tool explosion cannot happen by accident. Every bundled SKILL.md must declare its inheritance or silently lose its baseline rules, so test asserts that each one does.

## What would end this

This leans on assumption that people who clone repository into which this server is pointed are people who wrote it. guardrail imported from checkout is code, and nothing between clone and import inspects it. single incident of repository shipping hostile check, or first time this server is pointed at code user did not write, ends no-gate decision and brings back trust gate that was rejected above.

## Alternatives Considered

1. Declarative guardrails in YAML, rejected: check function is expressive surface and grammar would have to grow into language
1. trust gate before importing custom guardrail JS, rejected as ceremony for single-user tool; risk is recorded here instead
1. Keeping 30 always-on rules in engine, rejected: two places to look for rule is what this decision removes
1. appliesTo patterns on each rule instead of inherits on each skill, rejected: reading one SKILL.md must be enough to know what will run
1. Project layer winning over user layer, rejected: machine owner keeps last word over any repository content
