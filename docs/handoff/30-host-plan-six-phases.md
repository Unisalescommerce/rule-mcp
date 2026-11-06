# 30: The host plan in six phases, and the plan-of-plans retired

- **Branch**: `rel/v0.1.0`
- **Commit range**: `daa1df18..4eed58bd` (27 commits, this one excluded)
- **Base**: `main` (merge base `325936e6`); 288 feature commits ahead, 0 behind, 0 Conventional Commit violations, 2 merge commits in whole range
- **Date**: 2026-10-25

## Done

1. **`plan-of-plans` rewritten as one-branch orchestrator (ADR 172)** — stages 3-5 merged `ex`, `[removed]` and `ge` into `feat/evolution` that does not exist; content is already in this tree (87 plan nodes, ADR 143-154, `_export.md`, scripts-layout plan). graph dropped to one level, six-line node format to ADR 146's four-line form, and section 7 now ends with node to execute next.
2. **Host plan Phase 0** — 31 evidence rows in `src/cli/installers/hosts/_evidence.data.js`, each with study's status, mechanism in one line and page it rests on. Two contradictions resolved from sources, not from either claim: Roo Code "extension was shut down in May 2026" claim was false (docs are live), and Codex's command target moved to `~/.agents/skills` with `~/.codex/prompts` demoted to swept legacy directory (ADR 170 amended).
3. **Phase 1** — one host record for all 23 catalog agents (`hosts/index.js`), `_detect.js` rebuilt on it with no path literal left, and ten hook rows added so every host has mechanism or measured reason. Invariant test written first, red for right reason.
4. **Phase 2** — `levels.L0..L4` per host with computed ceiling (2 at L4, 5 at L3, 4 at L2, 12 at L0), `install --level` refusing above ceiling with each unreachable rung and its reason, Depth screen in wizard, Codex skills written instead of deprecated prompts, and roundtrip gate.
5. **Phase 3** — roundtrip ratchet emptied: Devin's skill directory, Cursor's `~/.cursorrules` and both install manifests are now removed by uninstaller that wrote them; manifest v2 carries level per host and reads v1 file as `null`; uninstallers ask host record instead of carrying eight hand-built paths; `doctor` prints `L2 of L3, next L3`.
6. **Phase 4** — eight measured products each got answer: seven have no documented MCP config file and real install try writes nothing and says so, and `cursor-cli` is covered by `cursor` because CLI reads editor's file (correction to plan).
7. **Phase 5** — measured, then rejected: `scripts/bench/hook-lifecycle.mjs` priced hooks (session-start 891 ms / 291 tokens, prompt-submit 1056 ms / 46 tokens, rest ~600 ms silent) and three cache-touching items died on it — replay is off (ADR 157), `cacheGet` evicts on read that found staleness, and hook process exits before it can warm anything. finding instead is spawn cost (ADR 176).
8. **Phase 6** — levels documented in `docs/04-operations.md` with test that recomputes every ceiling cell from record, `/rule-init` and `doctor` sharing `hostLevels()`, and ADRs 182-185.

## Commits this session

27 commits are listed by `git log daa1df18..4eed58bd --oneline`. shape: one `feat`/`fix` commit per phase, `docs(plans)` commit recording phase, and two `docs(adr)` commits (179 amended, 181 created) plus `docs(adr)` for 182-185.

## ADRs

- 181 retire cross-branch plan graph and orchestrate from `rel/v0.1.0`
- 182 one host record answers for every catalog host
- 183 integration depth is second install axis, capped by measured ceiling
- 184 install manifest records level per host
- 185 lifecycle wiring ships only where measurement moves
- 179 amended twice: Codex skill target, and false Roo Code shutdown claim

## Left out / next

- `docs/spike/` stays untracked (owner choice, unchanged since handoff 28).
- **Four open items in `_mcp-host-integration-depth.md` (33/37)**, each with its reason recorded: `_registry.js`/`_uninstall.js` as lookups over record (needs 23 writer bodies to move); `written[]` in manifest (no reader until project-scope installs land in step 8 of port plan); hook's own process cost (1056 ms per prompt against 1.3-2.4 s spawn floor, so measure floor on idle machine first); and per-host token measurement on claude/codex/pi, not run because nothing in this repository drives those agents end to end.
- port plan `installer-scope-adr-policy-features.md` has only step 3 done; steps 1, 2, 4-11 remain (numbering doctor, JetBrains/Junie, ADR policy, features, project scope, path completion, rules refresh, docs).
- 2 merge commits remain (`e9d29e8e`, `df6ba117`); `rule_tool_git action=linearize force=true` is proposal and needs owner's confirmation.
- Pre-existing red tests, unchanged and counted: at `daa1df18` suite was 826/848 with 20 failing; at this commit it is 833/853 with 18 failing, so this session closed two of them (roundtrip child's relative imports) and added five tests. rest: two plan-graph assertions, GPG release test, handbook numbering and link integrity, `src/cli/setup/opentui` barrel, 150-line ratchet offenders, `README advertises the catalog skill count`, `_daemon`, `repository-contract`, and e2e suites.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/30-host-plan-six-phases.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
The host plan is six phases in, 33 of 37: hosts/index.js is the single record for all 23 agents,
install --level enforces a computed ceiling, the uninstall leaves a pristine HOME, and the
lifecycle bench (scripts/bench/hook-lifecycle.mjs) settled Phase 5 with numbers rather than code.
First step: whatever comes next, read the four open items in
docs/plans/_mcp-host-integration-depth.md before choosing - three are deferrals with their reasons
and one (the hook's own process cost, 1056 ms per prompt) is the only measured problem left.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
