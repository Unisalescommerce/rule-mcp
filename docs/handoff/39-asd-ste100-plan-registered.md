# 39: ASD-STE100 plan registered (WS-G)

- **Branch**: `rel/v0.1.0`
- **Commit range**: `5c844053` (plan + plan-of-plans); this handoff excluded until committed
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0
- **Date**: 2026-10-31

## Done

1. **New track** [`docs/plans/_asd-ste100.md`](../plans/_asd-ste100.md) registered in [`plan-of-plans.md`](../plans/plan-of-plans.md) as **WS-G**.
2. **Scope of the plan:** ASD-STE100 writing at ~80% for every markdown surface this MCP helps create (plans, reviews, audits, ADR, handoff, newsletter/release notes, comments, impersonation); development-plan shape `WSn` / `WSn-Tx.y` with edge list **and** diagram; evaluate which tools/skills must honor `.gitignore`.
3. **Canonical directive (to implement next):** write in ASD-STE100 style at about 80%. Prefer short sentences, active voice, one idea per sentence, and the same word for the same thing. Keep ~20% natural tone. Prefer concrete verbs and named artifacts over abstract nouns.
4. Export / host / launcher remain closed (ADR 199–203). Handoff 38 still accurate for that closeout.

## State

- Index: `docs/plans/plan-of-plans.md` (WS-G open)
- Plan status: `_asd-ste100.md` = `planned` (no code yet at handoff time)
- Natural code homes (evidence): `src/core/directive` (session/prompt rules), `src/core/text` (synonyms/fillers/English), `skills/rule-styleguide-markdown`, `src/core/agents/commands/_personas.js`, `src/tools/actions/_impersonation.js`
- Branch ahead of origin ~101 (do not push unless asked)

## Left out / next

- Implement WS1 first (profile module + failing contract tests), then WS2 generators, WS3 plan shape, WS4 gitignore evaluation.
- Do not rewrite the whole historical docs tree in one pass.
- Do not invent a licensed STE dictionary product.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/39-asd-ste100-plan-registered.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Execute docs/plans/_asd-ste100.md (WS-G). Start WS1 in TDD: shared STE100~80 directive under src/core/directive,
contract tests for banned patterns, then wire sessionDirective / styleguide-markdown / impersonation.
Then WS3 plan shape (WSn / WSn-Tx.y + list + diagram) and WS4 gitignore eval matrix.
Export is done (ADR 199). Every commit is type(scope): subject. Do not push.
```
