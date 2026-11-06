# Let the environment name the client, and the handshake answer when it does not

- **Status**: accepted
- **Date**: 2026-10-29
- **Branch**: `rel/v0.1.0`
- **Supersedes**: none

## Context

`RULE_MCP_NO_PROMPTS=1` hides the MCP prompt list for every client at once. That is enough for a global install, where the entry belongs to one agent. It is not enough for a project entry: `.mcp.json` is one file several clients read, and a switch there cannot say "hide for Claude" without the server knowing whether Claude is the client asking.

The server does learn the client: the MCP `initialize` handshake carries `clientInfo.name`, and the SDK exposes it as `server.getClientVersion()`. Two facts narrowed the choice. The name in the handshake is chosen by the client and is not always the agent's catalog id (`claude-code` for `claude`). And `setClientInfo` already existed for the telemetry record with no caller at all, so nothing in the server used the handshake for anything.

## Decision

The client is `RULE_MCP_CLIENT` when the environment sets it, and the handshake's `clientInfo.name` otherwise. The environment wins because a shared entry can name the client it was written for, while the handshake only knows what the client chose to call itself; a deployment that knows it is serving Claude should say so rather than hope.

Suppression is `RULE_MCP_NO_MCP_PROMPTS`: `1` for every client, a comma list for the names it holds. A list entry matches the handshake string exactly, the part before a `/version`, or a `-`-delimited prefix, so `claude-code` matches `claude-code/2.1.0` and does not match `claude-codex`. A list never covers a client that did not identify itself - that is the one case where hiding is not the safe default.

`RULE_MCP_NO_PROMPTS=1` keeps its meaning and keeps working, and the telemetry level stops writing it: `telemetry --level anonymous` wrote that key to mean "record a prompt length, not the text", which made one variable mean two things and made an install that hid duplicate slash commands silently stop recording prompt text. It writes `RULE_MCP_NO_PROMPT_TEXT` instead, and the old key still reads as anonymous.

## Consequences

- A shared project entry can hide prompts for one client without hiding them for its neighbors.
- The installer still writes no policy of its own into a shared entry: the list is a property of the deployment, and a project entry that guessed would be wrong for every other client in it.
- The telemetry record now names the client, because the tool-call handler stores the handshake's answer before `clientInfo()` reads it.
- Two keys where there was one. The legacy alias is permanent in the reader and absent from every writer.
