# Agent instructions

This chapter tells what an agent receives from an install, and how an agent must work with RuleMCP.

## Where the rules live

An install writes two marked blocks into the instruction file of an agent: the routing block (`<!-- rule-mcp -->`) and the workflow block (`<!-- rule-mcp-rules -->`).

- A global install writes the blocks for each agent that it configures.
- A project install writes the blocks into the `CLAUDE.md` file of the project.
- `rule-mcp init` and each project install refresh a block that is already in the file. They keep the rest of the file. They create no block in a file that has none.

The refresh keeps a committed block current with the server.

## The rules on each prompt

The guard hooks add three rules to each session. `SessionStart` gives them in full. `UserPromptSubmit` gives a one-line reminder.

1. Call `rule_tool` or `rule_tool_gateway` before you implement anything.
2. Do not start subagents for research or implementation. Use the rule-mcp tools and TokenSave.
3. Keep the output short. Keep all facts and remove filler.

Agents with no hooks get the same rules in the body of each `/rule-*` command. Set `RULE_MCP_NO_PROMPT_DIRECTIVE=1` to stop the rules.

## Recommended workflow

1. Call `rule_tool_gateway` with the full request and the project path. It routes the request, loads the evidence, and runs the guardrails in one call.
2. Use the tool evidence as the source of truth. Do not invent APIs, files, dependencies, or passed checks.
3. If evidence is missing, call `rule_tool_search`. If it is still missing, state that you do not know.
4. Write a failing test before you change the implementation.
5. Run `rule_tool_check`. A failed guardrail blocks the work. Fix the code and run the check again.
6. Run the tests of the project. Report only the commands that you ran.
7. To write files, get a receipt from `rule_tool_gateway`, and then call `rule_tool_apply` with it.
8. Record structural decisions with `rule_tool_process_adr` when the ADR policy allows it.
9. Use `/rule-handoff` to close a session. Use `/rule-handon` to continue it.

The server can reject bad input and validate output shape. MCP cannot force the order of tool calls, so these steps are advisory. See `packages/mcp/core/enforcement/`.

## Resume a session

When you reopen an agent with a resume command, `SessionStart` fires with `source: "resume"`. If `docs/handoff/` holds a handoff, the hook runs `rule_tool_handon` and adds the result before the first prompt. Each claim has a label: still true, changed, or unverified.

The hook adds nothing on `startup`, `clear`, or `fork`. Set `RULE_MCP_NO_RESUME_HANDON=1` to stop this feature.

Some agents have no resume event. So a prompt that is only a resume request also works, for example `resume` or `riprendi`. The first tool call then carries the same result. This happens once for each process. A prompt that asks for real work does not trigger it.

## Frontend rules

- **No CSS classes.** Use element selectors and `[data-part]` or `[data-*]` selectors.
- **No inline styles.** Use external CSS.
- **Flex first.** Use `display: grid` only for named areas, subgrid, explicit placement, overlap, and auto-fit tracks. Give the reason in a `/* grid: why */` comment.
- **Semantic HTML.** Use a semantic element in place of a generic `<div>`.
- **Barrel pattern.** A component folder has `index.js`. Implementation files use `_PascalCase.ext`.
- **No unapproved CSS frameworks.** Do not use Tailwind, Bootstrap, or CSS-in-JS.

## Commands in each agent

Each agent gets the same command set: the `/rule` router first, then the other commands in alphabetical order. Use `rule-mcp agent-commands` to list or write them again.

- The commands are in the native format of each agent. [The instructions page](./16-instructions.md) lists the formats.
- Claude Code gets command files, and the install sets `RULE_MCP_NO_PROMPTS=1`. This hides the MCP prompts with the same names.
- GitHub Copilot CLI uses `/agent` and then `rule-mcp`.
- Codex CLI uses the installed skill.

`/rule-handoff` also commits pending work as scoped commits. It writes the handoff to `docs/handoff/` and commits it. It does not push.

## Prompts in a shared configuration

Several clients read one shared `.mcp.json` file, so a switch in that file applies to all of them. `RULE_MCP_NO_MCP_PROMPTS` hides the MCP prompts for the clients that it names. The shared entry does not set it, because the server cannot tell which client it serves.

## Minimal tool surface

A client that limits the tool list takes the `standard` surface instead of the full one. Set `RULE_MCP_SURFACE=standard` in the server configuration, or answer the Surface step that way. The area hubs stay reachable, and `rule_tool_search` loads the rest on demand.

[Environment variables](./10-env-variables.md) lists all settings.
