# 238: An update notifies by default and upgrades only when asked

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: update, release, install
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`updateMode()` in `packages/mcp/core/self-update/_config.js` returns `upgrade` unless `RULE_MCP_AUTO_UPDATE` says `notify`. Upgrade means checkout `main`, pull, reinstall, and for stdio install server then exits its own process. `docs/05-env-variables.md` already describes notify-only default and names value code never reads, so documentation and behavior disagree.

## Decision

default update mode becomes notify. tool reports available update on next tool result and names command to run. Automatic upgrade becomes opt-in with `RULE_MCP_AUTO_UPDATE=upgrade`, and no new command name is added: `/rule-update` in chat and `rule-mcp update` in shell already exist.

## Consequences

Positive: a running server no longer replaces itself under a session, and a stdio client stops losing its process mid-task. Positive: documentation and code agree on two values instead of three. Negative: a user who ignores the notice stays on an old release, so the notice has to be readable.

## What would end this

measured install failure caused by stale server outweighs cost of surprise restart, and default flips back.

## Alternatives Considered

1. Keep auto-upgrade as default
1. Disable updates entirely until release is declared stable
