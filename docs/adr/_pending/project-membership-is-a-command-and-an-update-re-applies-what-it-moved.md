# Pending: Project membership is a command, and an update re-applies what it moved

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: installer, project-scope, update, uninstall
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

A project-scope install was only reachable through `setup --scope project --project <path>`, and an uninstall left the project's store entry and an empty config file behind. A third checkout meant repeating every flag, because the store recorded what a project got but nothing read it back. Separately, `rule-mcp update` replaced the code under every install and re-applied none of them, so the commands, skills and env each host carried described a server that no longer existed.

## Decision

Add `rule-mcp project add [path]` and `rule-mcp project remove [path]`. Add reuses the agents and the config kind of the most recently recorded project, so the second checkout is one command and an empty store falls back to every project-capable host; remove writes nothing new and takes back every config the install wrote, then forgets the root. An uninstall that leaves an entry as the whole file now removes the file instead of writing an empty document, in both dry-run and real runs. A successful self-update calls reapplyRememberedInstalls(), which walks the manifest and projects.json through the same tasks the feature switches already used; the count it reports skips the empty-store placeholder, and the runPlan call it depends on takes the plan as its first argument again.

## Consequences

Positive: membership is one command with a dry run and json output, a project tree does not keep empty config files, and an update leaves the installs matching the code it fetched. Negative: `project add` with an empty store configures every project-capable host, which is loud on a first run; the update walk lengthens the command and rewrites host configs without asking, which is the point but is visible; and the walk re-runs agents recorded in the manifest, so a manifest that is stale re-applies a stale selection.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave membership to setup flags: every new checkout repeats --scope, --project and --project-config, which is what the store exists to avoid.
1. Delete an empty config file in every uninstall path: a host's user-level config may be expected by the client even when empty, so only a project file is removed.
1. Skip the update walk and document it: each update silently leaves every install one version behind, which is the failure the manifest was added to make visible.
