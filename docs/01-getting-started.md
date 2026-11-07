# Getting started

This chapter tells you how to install RuleMCP and connect your agent.

## What RuleMCP does

RuleMCP is an [MCP](https://modelcontextprotocol.io) server. It does three things:

1. It routes a free-text request to the skill that owns it.
2. It serves skills as MCP tools, resources, and prompts.
3. It checks generated code with deterministic guardrails.

No model runs inside the server. Any agent that speaks MCP can use it. The tools and the guardrails give the same result with any model.

## Requirements

| Item    | Version     | Check            |
| ------- | ----------- | ---------------- |
| Node.js | 24 or newer | `node --version` |
| pnpm    | 11 or newer | `pnpm --version` |

The server stops at start if the Node.js version is too old. There is no npm package, so you install from a clone or from a release tarball.

## Install

```bash
git clone https://github.com/pixu1980/rule-mcp.git
cd rule-mcp
pnpm setup
```

`pnpm setup` deletes `node_modules` and `pnpm-lock.yaml`, installs again, adds the global `rule-mcp` command, and starts the setup wizard. The wizard needs a terminal. In a pipe, the plain runner uses the same defaults.

The wizard finds your agents, writes their MCP configuration, and runs the health check. [Install and uninstall](./04-install.md) lists each step.

To keep the lockfile, run `pnpm install --frozen-lockfile` and then `./scripts/install.sh`.

## Do a check of the install

```bash
rule-mcp doctor
```

The report shows the registered tools, the detected agents, and the state of the hooks. Restart your agent after the install. The agent reads MCP entries only when it starts.

## Prepare a project

Do this step in your own project, not in this repository:

```bash
cd ~/my-project
```

```bash
rule-mcp init
```

`rule-mcp init` creates the recorder directory, installs the `commit-msg` and `pre-push` git hooks, refreshes the rules block, and reports the dependency pins. It also indexes the project with TokenSave. Use `--no-tokensave` to skip the index.

## The main flows

- **Route.** `rule_tool` names the skill and loads its evidence. For a broad request, it returns the area hub. A narrower call then selects the leaf skill.
- **Check.** `rule_tool_check` runs the guardrails of the skill. A failure blocks the work. `mode: "project"` also runs the graph checks.
- **Fix.** `rule_tool_fix` applies the deterministic fixes. In a shell, use `rule-mcp fix --no-dry-run`.
- **Handoff.** `rule-mcp handoff` writes a handoff before you stop. `rule-mcp handon` compares the last handoff with the repository.
- **Personas.** A persona is a review role. Use `rule_tool_plan`, `rule_tool_audit`, or `rule_tool_review`.
- **Cache.** `rule-mcp cache stats` shows the tool cache. Set `RULE_MCP_NO_CACHE=1` to stop the cache for a run.
- **Decision layer.** This layer is off by default. Set `RULE_MCP_DECISION_CACHE_SHADOW=1` to measure it, and then read `pnpm report:decision-cache`. Turn on replay only when the report shows zero false replays.

## Next steps

- [Install targets](./22-install-targets.md): the agents that the installer supports
- [Engineering guides](./12-engineering-guides.md): how to work on this repository
- [Architecture](./02-architecture.md): the path of a request
- [CLI](./17-cli.md) and [environment variables](./10-env-variables.md): each flag and setting
