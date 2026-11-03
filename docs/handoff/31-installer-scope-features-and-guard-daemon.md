# 31: Installer-scope features, project installs, and the guard daemon

- **Branch**: `rel/v0.1.0`
- **Commit range**: `46f90b65..15341994` (35 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in whole feature range: 2
- **Date**: 2026-10-28

## Done

1. **Hook spawn remasured (ADR 187–189)** — Idle floor on this machine is ~43–55 ms (`node -e 0`), not 1.3–2.4 s. `prompt-submit` ~115 ms. Guard skips `bootstrapCoreTools`; optional `guard --loop`; Unix-socket daemon + thin `--send` (~87 ms vs ~214 ms full CLI). Install starts the daemon; writers emit `--send`.
2. **Host maps as record lookups (ADR 190)** — `installers`/`uninstallers` are `Object.fromEntries` over `hostRecord`; path core stays cycle-free from the writers table.
3. **JetBrains → Junie path (ADR 191)** — install writes `~/.junie/mcp/mcp.json`, not project `.idea`.
4. **Project-scope slice A+B (ADR 192–193)** — `_project-hosts.data.js`, `_install-project.js`, manifest `written[]`, `state/projects.json`, setup `--scope project` / `--project` / `--project-config` / `--refresh-projects`.
5. **Numbering doctor (ADR 194)** — `-M70%` before `--follow` so template copies keep their own date/author.
6. **ADR policy (ADR 195)** — levels `full`/`handoff`/`on-demand`; resolve project file → env → env.json → default handoff.
7. **Pending ADR numbers on land (ADR 196)** — off-trunk writes `_pending/<slug>.md`; `handoff land`, post-merge/post-rewrite, and closeout assign numbers.
8. **Features catalog (ADR 197)** — `src/core/runtime/features`: adr, telemetry, update, tokensave, minimal-tools. Persist `~/.rule-mcp/config/env.json`. CLI `feature list|enable|disable`; setup `--feature` / `--adr-policy`; wizard Features step. `adr=off` hides ADR tools/prompts; `telemetry=anonymous` drops prompt text, client name, installation id.

## Commits this handoff window

See `git log 46f90b65..15341994 --oneline`. Shape: guard/daemon/install → project-scope → ADR policy/pending → `feat(setup)` features + `docs(adr)` 197.

## ADRs

- 187 guard skips core-tool bootstrap; optional `--loop`
- 188 guard daemon + thin `--send`
- 189 install starts daemon; hooks use `--send`
- 190 installers as host-record lookups
- 191 JetBrains into Junie's user file
- 192 project-host table + `written[]`
- 193 setup `--scope project` + `projects.json`
- 194 numbering doctor `-M70%`
- 195 ADR write policy (default handoff)
- 196 pending ADR numbers on trunk land
- 197 own every user-facing switch as a feature

## Left out / next

- **installer-scope** remaining: Step 7 Claude attribution; Step 8 leftovers (`project add/remove`, update walk, Claude extras, wizard Scope UI); Step 9 docs census regen for features/env.
- **mcp-host** (35/37): token/turn per-host still not measurable here (no E2E driver). Hook process narrative in handoff 30 is stale (superseded by remasure + ADR 187–189).
- 2 merge commits remain in the long feature range (`e9d29e8e`, `df6ba117`); linearize only with owner confirmation.
- `docs/spike/` stays untracked (owner choice).
- Numbering-hook removal when `adr=off` still depends on install refresh, not a separate uninstall path.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/31-installer-scope-features-and-guard-daemon.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Installer-scope shipped through Features (ADR 197): catalog, RULE_MCP_HOME env.json,
feature CLI, setup flags, wizard Features step; guard daemon + --send; project --scope.
First step: installer-scope Step 7 (Claude attribution) or remaining Step 8 items
(project add/remove, update walk, wizard Scope UI) — read
docs/plans/installer-scope-adr-policy-features.md before choosing.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
