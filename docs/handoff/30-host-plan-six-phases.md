# 30: The host plan in six phases, and the plan-of-plans retired

- **Branch**: `rel/v0.1.0`
- **Commit range**: `daa1df18..4eed58bd` (27 commits, this one excluded)
- **Base**: `main` (merge base `325936e6`); 288 feature commits ahead, 0 behind, 0 Conventional Commit violations, 2 merge commits in the whole range
- **Date**: 2026-10-25

## Done

1. **`plan-of-plans` rewritten as a one-branch orchestrator (ADR 181)** — stages 3-5 merged `ex`, `[removed]` and `ge` into a `feat/evolution` that does not exist; the content is already in this tree (87 plan nodes, ADR 151-154, `_export.md`, the scripts-layout plan). The graph dropped to one level, the six-line node format to ADR 154's four-line form, and section 7 now ends with the node to execute next.
2. **Host plan Phase 0** — 31 evidence rows in `src/cli/installers/hosts/_evidence.data.js`, each with the study's status, the mechanism in one line and the page it rests on. Two contradictions resolved from the sources, not from either claim: the Roo Code "extension was shut down in May 2026" claim was false (the docs are live), and Codex's command target moved to `~/.agents/skills` with `~/.codex/prompts` demoted to a swept legacy directory (ADR 179 amended).
3. **Phase 1** — one host record for all 23 catalog agents (`hosts/index.js`), `_detect.js` rebuilt on it with no path literal left, and ten hook rows added so every host has a mechanism or a measured reason. Invariant test written first, red for the right reason.
4. **Phase 2** — `levels.L0..L4` per host with a computed ceiling (2 at L4, 5 at L3, 4 at L2, 12 at L0), `install --level` refusing above the ceiling with each unreachable rung and its reason, a Depth screen in the wizard, Codex skills written instead of deprecated prompts, and the roundtrip gate.
5. **Phase 3** — the roundtrip ratchet emptied: Devin's skill directory, Cursor's `~/.cursorrules` and both install manifests are now removed by the uninstaller that wrote them; manifest v2 carries a level per host and reads a v1 file as `null`; uninstallers ask the host record instead of carrying eight hand-built paths; `doctor` prints `L2 of L3, next L3`.
6. **Phase 4** — the eight measured products each got an answer: seven have no documented MCP config file and a real install attempt writes nothing and says so, and `cursor-cli` is covered by `cursor` because the CLI reads the editor's file (a correction to the plan).
7. **Phase 5** — measured, then rejected: `scripts/bench/hook-lifecycle.mjs` priced the hooks (session-start 891 ms / 291 tokens, prompt-submit 1056 ms / 46 tokens, the rest ~600 ms silent) and the three cache-touching items died on it — replay is off (ADR 166), `cacheGet` evicts on the read that found staleness, and a hook process exits before it can warm anything. The finding instead is the spawn cost (ADR 185).
8. **Phase 6** — the levels documented in `docs/04-operations.md` with a test that recomputes every ceiling cell from the record, `/rule-init` and `doctor` sharing `hostLevels()`, and ADRs 182-185.

## Commits this session

The 27 commits are listed by `git log daa1df18..4eed58bd --oneline`. The shape: one `feat`/`fix` commit per phase, a `docs(plans)` commit recording the phase, and two `docs(adr)` commits (179 amended, 181 created) plus `docs(adr)` for 182-185.

## ADRs

- 181 retire the cross-branch plan graph and orchestrate from `rel/v0.1.0`
- 182 one host record answers for every catalog host
- 183 integration depth is the second install axis, capped by a measured ceiling
- 184 the install manifest records a level per host
- 185 lifecycle wiring ships only where a measurement moves
- 179 amended twice: the Codex skill target, and the false Roo Code shutdown claim

## Left out / next

- `docs/spike/` stays untracked (owner choice, unchanged since handoff 28).
- **Four open items in `_mcp-host-integration-depth.md` (33/37)**, each with its reason recorded: `_registry.js`/`_uninstall.js` as lookups over the record (needs the 23 writer bodies to move); `written[]` in the manifest (no reader until project-scope installs land in step 8 of the port plan); the hook's own process cost (1056 ms per prompt against a 1.3-2.4 s spawn floor, so measure the floor on an idle machine first); and the per-host token measurement on claude/codex/pi, not run because nothing in this repository drives those agents end to end.
- The port plan `installer-scope-adr-policy-features.md` has only step 3 done; steps 1, 2, 4-11 remain (numbering doctor, JetBrains/Junie, ADR policy, features, project scope, path completion, rules refresh, docs).
- 2 merge commits remain (`e9d29e8e`, `df6ba117`); `rule_tool_git action=linearize force=true` is the proposal and needs the owner's confirmation.
- Pre-existing red tests, unchanged and counted: at `daa1df18` the suite was 826/848 with 20 failing; at this commit it is 833/853 with 18 failing, so this session closed two of them (the roundtrip child's relative imports) and added five tests. The rest: the two plan-graph assertions, the GPG release test, handbook numbering and link integrity, the `src/cli/setup/opentui` barrel, the 150-line ratchet offenders, `README advertises the catalog skill count`, `_daemon`, `repository-contract`, and the e2e suites.

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
