# Architecture

This chapter tells how a request moves through RuleMCP.

## Workspace

The repository is a private pnpm workspace with the name `rule-mcp-workspace`. It has three packages:

| Package           | Name              | Content                        |
| ----------------- | ----------------- | ------------------------------ |
| `packages/mcp`    | `rule-mcp`        | The server, the CLI, the tools |
| `packages/shared` | `rule-mcp-shared` | Helpers that packages share    |
| `packages/docs`   | `rule-mcp-docs`   | The documentation site builder |

The root also holds `bin/`, `skills/`, `personas/`, `prompts/`, and `scripts/`. The server needs all of them at run time. All workspace packages are in the repository, so a clone builds with no other project.

## Request path

An agent request follows these steps.

1. **Agent.** The agent sends a prompt, a slash command, or a tool call.
2. **Transport.** The default transport is stdio. A long-running local server uses HTTP and SSE.
3. **Router.** `rule_tool` gives a score to the request and selects a skill or an area hub.
4. **Skill or tool.** The skill serves its evidence: a styleguide, a template, or a pattern.
5. **Guardrails.** Deterministic checks read the proposed code.
6. **Response.** The agent receives structured content. The server does not call a model.

## Surfaces

| Surface        | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| Slash commands | The same set in each agent: router, areas, sessions, personas |
| MCP tools      | Action tools, and one tool for each catalog skill             |
| MCP prompts    | Workflow, area, and persona prompts                           |
| MCP resources  | `rule://` indexes and summaries                               |
| Guardrails     | Deterministic checks, owned by skills                         |
| CLI            | Install, health check, server, tools                          |

[The surface map](./21-surface-map.md) gives the live counts.

## Skill layers

The server reads skills from three layers. The last layer that defines a name wins.

1. **Native.** The `skills/` directory of the server.
2. **Project.** `.rule-mcp/skills/` in the project.
3. **User.** `skills/` in the runtime home, `~/.rule-mcp/skills/` by default.

[Custom skills](./07-custom-skills.md) tells how to use these layers.

## Design rules

- **Local first.** Skills are on disk. The core features need no network.
- **Model-agnostic.** There is no LLM inside the server.
- **Registry-driven.** The census and the agent commands read the same registries.
- **Area hubs.** A leaf skill has no slash command. An area hub reaches it.

## Related pages

- [Getting started](./01-getting-started.md)
- [Environment variables](./10-env-variables.md)
