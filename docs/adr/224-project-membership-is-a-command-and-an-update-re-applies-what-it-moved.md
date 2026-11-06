# 224: Project membership is a command, and an update re-applies what it moved

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: installer, project-scope, update, uninstall
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

project-scope install was only reachable through `setup --scope project --project <path>`, and uninstall left project's store entry and empty config file behind. third checkout meant repeating every flag, because store recorded what project got but nothing read it back. Separately, `rule-mcp update` replaced code under every install and re-applied none of them, so commands, skills and env each host carried described server that no longer existed.

## Decision

Add `rule-mcp project add [path]` and `rule-mcp project remove [path]`. Add reuses agents and config most recently recorded project, so second checkout is one command and empty store falls back to every project-capable host; remove writes nothing new and takes back every config install wrote, then forgets root. uninstall that leaves entry as whole file now removes file instead of writing empty document, in both dry-run and real runs. successful self-update calls reapplyRememberedInstalls(), which walks manifest and projects.json through same tasks feature switches already used; count it reports skips empty-store placeholder, and runPlan call it depends on takes plan as its first argument again.

## Consequences

Positive: membership is one command with a dry run and json output, a project tree does not keep empty config files, and an update leaves the installs matching the code it fetched. Negative: `project add` with an empty store configures every project-capable host, which is loud on a first run; the update walk lengthens the command and rewrites host configs without asking, which is the point but is visible; and the walk re-runs agents recorded in the manifest, so a manifest that is stale re-applies a stale selection.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave membership to setup flags: every new checkout repeats --scope, --project and --project-config, which is what store exists to avoid.
1. Delete empty config file in every uninstall path: host's user-level config may be expected by client even when empty, so only project file is removed.
1. Skip update walk and document it: each update silently leaves every install one version behind, which is failure manifest was added to make visible.
