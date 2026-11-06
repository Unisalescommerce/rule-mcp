# 28: OpenTUI installer, Codex hooks, and command targets

- **Branch**: `rel/v0.1.0`
- **Commit range**: `fde6530b..23187b54` (5 commits this session)
- **Date**: 2026-10-25
- **Base**: `main` (merge base `325936e6`); feature has 0 Conventional Commit violations, 2 merge commits in full range (handoff audit; no `--close-feature` / squash this session)

## Done

1. **OpenTUI installer** — Reworked setup wizard on `@opentui/core` (exact `0.6.8`). One profile set; Surface is the only tier picker; slash-command selection follows Surface (ADR 169). Old Ink/step UI removed.
2. **Command targets** — Codex → `~/.codex/prompts/*.md` (`/prompts:<name>`); Copilot CLI → `~/.copilot/skills/<name>/SKILL.md`. Nested skill sync create/remove. Gaps for codex/copilot removed (ADR 170).
3. **Codex hook titles** — Every Codex handler carries `statusMessage` so `/hooks` no longer shows "Unnamed hook". Commands tagged `env RULE_MCP_HOOK_HOST=codex`.
4. **Codex PreToolUse compatibility** — Codex rejects bare `permissionDecision:allow` and `:ask`. Guard now emits silent `{}` for allow; on Codex, ask → `decision:block` with reason (ADR 171).

## Commits this session

1. `ce3f4643` feat(setup): rework installer wizard on OpenTUI
2. `e2460540` feat(commands): add Codex and Copilot command targets
3. `79857612` feat(install): name Codex hooks and tag host env
4. `a72a7e6d` fix(guard): emit Codex-safe PreToolUse answers
5. `23187b54` docs(adr): record installer and Codex hook ADRs 178-180

## Left out / next

- `docs/spike/` left untracked (user choice).
- Live `~/.codex/hooks.json` still needs reinstall + re-trust for `statusMessage` / `RULE_MCP_HOOK_HOST`.
- Global `rule-mcp` binary must be this tree for the guard fix to apply in Codex.
- Codex true `ask` UX via `PermissionRequest` not wired.
- MCP-performance lifecycle hooks inventory only; not implemented.
- No push. PR #10 update only on explicit ask.
- Optional: `--close-feature` / squash when ready to land on base.

## ADRs

- 178 Surface is the only tier picker; slash commands follow it
- 179 Codex named hooks and Codex/Copilot command file targets
- 180 Codex PreToolUse silent allow and ask as block

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/28-opentui-codex-hooks-and-command-targets.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
First step: reinstall/re-trust Codex hooks from this tree (statusMessage + RULE_MCP_HOOK_HOST) and verify PreToolUse no longer fails with unsupported permissionDecision:allow; then decide whether to push/update PR #10 or run --close-feature.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
```
