See ./CLAUDE.md for the full project rules. Non-negotiable for AI coding agents:

- Conventional Commits WITH a scope: `type(scope): subject` - the commit-msg hook rejects scope-less subjects.
- Use the rule-mcp workflow: route via `rule-mcp` tools before implementing, run `rule_tool_check`, write failing tests first.
- Two repos: `rule-mcp` (this; MCP server) and `rule-mcp-architect` (standalone web app + SDK - the former architect wizard).
- Durable development plans: create with `rule_tool_write_plan` under `docs/plans/_*.md` and register in `plan-of-plans.md`. Host CreatePlan under `~/.local/share/opencode/plans/` is session UI only, not source of truth.
- Plan lifecycle closes itself: a plan with `Status:` done and no open step becomes an ADR at the next handoff/resume, is retired from `plan-of-plans.md` and `skills/_skills-plan.md`, and its file is deleted. `closeout: "preview"` shows that list without writing.
