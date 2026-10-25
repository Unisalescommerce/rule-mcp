# 184: The install manifest records a level per host

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, manifest, hosts
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The manifest was v1: a list of agent names plus the dimensions and the transport. It recorded that a host was installed and nothing about what it got, so doctor could print the ceiling of every configured host and not one word about the depth, and an uninstall re-derived paths instead of reading them. The roundtrip test found the consequence: Devin's skill directory, Cursor's rules block and both manifests outlived the uninstall that was supposed to remove them.

## Decision

The manifest is v2: a hosts map carrying the level each host was installed at, beside agents[] for compatibility. A v1 file is read as v2 with level: null - which doctor prints as "installed before the manifest knew" rather than pretending the depth is zero - and the next write upgrades the file. uninstall calls forgetHost, which empties the JSON manifest and deletes the human-readable one in the same step, because they are two views of one fact.

## Consequences

doctor reports L2 of L3, next L3 for a host installed at a level, and the roundtrip leaves a temporary HOME with nothing but the writers' .bak backups. Deferred with the reason recorded: the written[] file list the plan also wanted, because with the uninstall deriving from one host record the only thing it would add is project-scope installs, which the port plan has not written yet - a field no reader consumes is decoration.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Read the level from the host record instead of the manifest: rejected, because the record says what a host can reach, not what this machine installed
1. Migrate the file to v2 on read: rejected, because a read that writes surprises a dry run
1. Keep v1 and re-detect on uninstall: rejected, and it is the behaviour that left the leftovers the roundtrip test found
