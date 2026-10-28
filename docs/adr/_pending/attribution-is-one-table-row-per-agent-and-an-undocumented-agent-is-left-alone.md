# Pending: Attribution is one table row per agent, and an undocumented agent is left alone

- **Date**: 2026-10-28
- **Status**: proposed
- **Tags**: installer, hosts, attribution, agents
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The installer plan carried a Claude-only attribution switch: one setting in .claude/settings.json. Attribution is not one vendor's key. Every coding agent that writes commit messages, pull request bodies or trailers does it in its own file, under its own key, with its own two values, or documents nothing at all. A switch wired to one vendor implies the other twenty-two catalog agents behave the same way, which is not a fact this repository established.

## Decision

Model attribution as _attribution.data.js: one row per agent in allAgents() (23 today) carrying { agent, mechanism, file, key, keep, hide, evidence }. mechanism is one of commit-trailer, pr-body, tool-signature, none. A row is written only when evidence names the vendor page; an unverified row carries no values, produces no writer, and the install prints that attribution is not documented for that agent. applyAttribution(agent, text, { mode }) writes in the row's own dialect (JSON through _writers-json.js, TOML through the _host-formats.js writers) under one invariant set: a value the user set stays, hide replaces only the exact value an install wrote, an unparseable file is refused, and a non-project-scope install never writes into a project.

## Consequences

Positive: the writer, the wizard, --dry-run and the tests read one table, so they cannot disagree; an agent with no documented control is visibly unsupported instead of silently misconfigured; a new agent is a row plus a cited page. Negative: every row costs a vendor-doc read before it can be written, so the first landing ships with few documented rows; the 2026-10-28 pass found no vendor page reachable from this checkout, so rows land later than the plan's other steps.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep it as a Claude Code switch and add vendors one at a time, each with its own flag; the CLI surface grows per vendor and the wizard cannot say which agents it will touch.
1. Ship a single uniform attribution key across agents; it would write keys vendors never documented, which is the failure the host-path table already fixed once.
