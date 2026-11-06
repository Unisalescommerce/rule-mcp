# Let the environment name the client, and the handshake answer when it does not

- **Status**: accepted
- **Date**: 2026-10-29
- **Branch**: `rel/v0.1.0`
- **Supersedes**: none
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`RULE_MCP_NO_PROMPTS=1` hides MCP prompt list for every client at once. That is enough for global install, where entry belongs to one agent. It is not enough for project entry: `.mcp.json` is one file several clients read, and switch there cannot say "hide for Claude" without server knowing whether Claude is client asking.

The server does learn the client: the MCP `initialize` handshake carries `clientInfo.name`, and the SDK exposes it as `server.getClientVersion()`. Two facts narrowed the choice. The name in the handshake is chosen by the client and is not always the agent's catalog id (`claude-code` for `claude`). And `setClientInfo` already existed for the telemetry record with no caller at all, so nothing in the server used the handshake for anything.

## Decision

client is `RULE_MCP_CLIENT` when environment sets it, and handshake's `clientInfo.name` otherwise. environment wins because shared entry can name client it was written for, while handshake only knows what client chose to call itself; deployment that knows it is serving Claude should say so rather than hope.

Suppression is `RULE_MCP_NO_MCP_PROMPTS`: `1` for every client, comma list for names it holds. list entry matches handshake string exactly, part before `/version`, or `-`-delimited prefix, so `claude-code` matches `claude-code/2.1.0` and does not match `claude-codex`. list never covers client that did not identify itself - that is one case where hiding is not safe default.

`RULE_MCP_NO_PROMPTS=1` keeps its meaning and keeps working, and telemetry level stops writing it: `telemetry --level anonymous` wrote that key to mean "record prompt length, not text", which made one variable mean two things and made install that hid duplicate slash commands silently stop recording prompt text. It writes `RULE_MCP_NO_PROMPT_TEXT` instead, and old key still reads as anonymous.

## Consequences

- shared project entry can hide prompts for one client without hiding them for its neighbors.
- installer still writes no policy of its own into shared entry: list is property of deployment, and project entry that guessed would be wrong for every other client in it.
- telemetry record now names client, because tool-call handler stores handshake's answer before `clientInfo()` reads it.
- Two keys where there was one. legacy alias is permanent in reader and absent from every writer.
