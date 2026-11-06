# Session handoff: guardrail plan retirement and closeout

- **Branch**: `rel/v0.1.0`.
- **Commit range**: `32d9bd4af..0e9415556`.
- **Date**: `2026-11-06`.
- **Base**: `main` at merge base `325936e632804367d34488f165b0df192bb9f119`.

## Delivered

- Added Betterleaks-backed Git secret scanning and deterministic provider checks. The scanner is offline, bounded, and redacts values.
- Fixed the Git guard to inspect staged index bytes and preserve unusual paths.
- Added Pi discovery words and single-item schema coercion for gateway and ADR tools.
- Fixed closeout archival so wrapped checkbox text and plan prose survive in the ADR.
- Fixed handon verification of pending ADR paths.
- Registered the OSS readiness, tool and skill surface, and publication cutover plans in the level-zero dependency graph.
- Verified that the six area guardrail plans were not fully absorbed. AI already retained 8 rule IDs; the other areas lacked 68 IDs.
- Assigned all 76 retained rule IDs to explicit skill-plan owners, added regression coverage, deleted the six superseded files, and removed their references.
- Corrected catalog-orchestration citations from ADR 145 to ADR 166.
- Recorded the retirement decision in `docs/adr/237-retire-area-guardrail-plans-after-assigning-every-retained-rule.md`.
- Closed `docs/plans/_plan-of-plans-reference.md` into ADR 204 and `docs/handoff/plans/plan-of-plans-reference.md`.

## Commits since handoff 50

- `b1ae83b9e` `feat(security): expand deterministic secret checks`.
- `891202991` `docs(security): close secret guardrails plan`.
- `c83af6421` `fix(guard): inspect staged index contents`.
- `47d69fe32` `docs(adr): close secret guardrails plan`.
- `9e9a7f53d` `fix(test): split the secret corpus out of the ratchet file`.
- `1771d05b4` `feat(tools): name discovery terms in tool descriptions`.
- `9b59b41a2` `feat(tools): accept single items in tool schemas`.
- `98bd36658` `docs(plans): record pi tool contract progress`.
- `886a4b184` `fix(handoff): keep closed steps and plan prose in the closeout`.
- `e6a666062` `fix(handon): resolve pending ADR paths`.
- `92ed881c1` `docs(plans): close the plan audit findings`.
- `065c47f6c` `docs(plans): register audit and publication tracks`.
- `3088ef828` `docs(plans): retire superseded guardrail plans`.
- `0e9415556` `docs(adr): close the plan graph reference`.

## Verification

- Plan, handon, closeout, ADR reference, and link suites: 93 passed.
- Guardrail-plan retirement regression: all 76 IDs have owners; no retired file or reference remains.
- Census and smoke checks passed.
- Full suite: 3090 tests, 3084 passed, 3 failed, 3 skipped.
- Remaining failures:
  - shell completion does not include `secrets`;
  - `_secret-token-rarity.js` imports outside its portable rule folder;
  - `rule_tool_keep` reads an undefined decision-cache status.
- Working tree was clean before this handoff file.
- No push was performed.

## Open work

- `_oss-readiness-and-repo-health.md`: registration is done. WS1 must record four accepted repository decisions as ADRs. WS2 then fixes the dead repository slug. WS3 changes self-update to notify by default. WS4 holds the smaller cleanup tasks.
- `_tool-and-skill-surface-audit.md`: WS5 is complete. WS1 and WS2 must verify the current surface and check counts. WS4 still removes duplicated orchestrator prose after Pi WS2 closes.
- `_pi-integration-and-debt.md`: WS1-T3 and WS1-T3.1 require a real Pi environment. WS2 catalog debt remains open.
- `_publication-cutover.md`: execution has HARD dependencies on the OSS and surface plans. Its WS1 owns the three current full-suite failures.
- The area-plan retirement ADR remains pending because this branch is not the numbering trunk.

## Decisions and constraints

- Do not restore the retired area guardrail plans. Change the ownership map and its regression test if a retained rule moves or is intentionally removed.
- ADR 166, not ADR 145, is the catalog-orchestration decision.
- Run one ADR-writing session at a time because `docs/adr/ADR.md` and numbering are shared.
- Keep dependencies exact. Use `pnpm` and `pnpx`.
- Never push without explicit authorization.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace on branch `rel/v0.1.0`. Read `docs/handoff/51-guardrail-plan-retirement-and-closeout.md`, then run `rule_tool_handon` before trusting plan state. First take `_oss-readiness-and-repo-health.md` WS1-T1: record the repository-slug decision through `rule_tool_process_adr`; keep ADR writes serialized and do not change code in that step. Preserve the 76-rule ownership regression, use exact dependency pins, commit with `type(scope): subject`, and never push without explicit authorization. The full suite has three known failures owned by publication-cutover WS1: missing `secrets` completion, the non-portable token-rarity import, and the undefined decision-cache status.
```
