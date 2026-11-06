# 239: Publish an npm placeholder to reserve the rule-mcp name

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: naming, legal, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 076 decided against npm placeholder and set review date of 2027-03-10. `npm view rule-mcp` answers 404 today, so nobody owns name. Publication is now in scope: repository goes public at talk time, and public README that points at unowned package name invites squat.

## Decision

Publish placeholder package named `rule-mcp` that does nothing: no scripts, no dependencies, no binary, no postinstall. owner publishes it by hand with two-factor authentication when repository goes public. trademark posture of ADR 076 is unchanged, and no document tells user to run placeholder.

## Consequences

Positive: the name is held by the project that documents it. Positive: a user who installs it gets a package that explains where the real server is instead of a stranger's code. Negative: the placeholder has to be maintained enough to stay honest, and it is a second publication target beside the release workflow.

## What would end this

real package ships under same name, which replaces placeholder rather than sitting beside it.

## Alternatives Considered

1. Leave name unclaimed until first real release
1. Publish real package now, before repository is public
