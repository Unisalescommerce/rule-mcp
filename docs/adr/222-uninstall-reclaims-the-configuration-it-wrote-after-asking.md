# 222: Uninstall reclaims the configuration it wrote, after asking

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: installer, uninstall, privacy, configuration
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Uninstall removed rule-mcp entry from each agent's config and stopped there. Everything else installer had written stayed on disk: switches file (~/.rule-mcp/config/env.json), legacy ~/.config/rule-mcp/env.json, install manifest and projects.json. later install then read decisions nobody had made - tokensave 0 that installer itself had written was indistinguishable from choice - and two record files kept pointing at installs that no longer existed. --purge deleted whole runtime home, but it was only path that cleaned anything, and it also deletes state user may want to keep for reinstall.

## Decision

Uninstall gains a config step after the agent cleanup: reclaimTargets() names the four files rule-mcp owns - switches, legacy switches, manifest, projects store - listing the absent ones too, and reclaimConfig() deletes them. The step asks before deleting, because these are the only files that hold user preferences; --keep-config keeps the two switches files and still drops the records, which describe installs and not preferences; --json and --no-interactive answer for the user so a script never blocks; --purge deletes the runtime home instead and the reclaim does not run twice. The manifest is normally already gone by then, since forgetInstall drops it when nothing is left to remember.

## Consequences

Positive: the 'never chose' state is reachable again, so the derived tokensave default applies; a reinstall no longer inherits records of installs that are gone; deletion is announced in the uninstall report with one row per file and status. Negative: uninstall is now a destructive command by default rather than only under --purge, so a user who reruns uninstall to repair an agent loses their switches unless they pass --keep-config; a non-interactive run cannot ask, so it deletes without confirmation by design.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Clean only under --purge: leaves stale switches and records in default path, which is where they were found.
1. Never clean and document paths: derived default stays unreachable for every existing user and report keeps citing dead installs.
1. Clean switches only: record files would still name installs that are gone, and forgetInstall would keep rewriting manifest nobody owns.
