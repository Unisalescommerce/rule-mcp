# Pending: Publish an npm placeholder to reserve the rule-mcp name

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: naming, legal, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 084 decided against an npm placeholder and set a review date of 2027-03-10. `npm view rule-mcp` answers 404 today, so nobody owns the name. Publication is now in scope: the repository goes public at talk time, and a public README that points at an unowned package name invites a squat.

## Decision

Publish a placeholder package named `rule-mcp` that does nothing: no scripts, no dependencies, no binary, no postinstall. The owner publishes it by hand with two-factor authentication when the repository goes public. The trademark posture of ADR 084 is unchanged, and no document tells a user to run the placeholder.

## Consequences

Positive: the name is held by the project that documents it. Positive: a user who installs it gets a package that explains where the real server is instead of a stranger's code. Negative: the placeholder has to be maintained enough to stay honest, and it is a second publication target beside the release workflow.

## What would end this

The real package ships under the same name, which replaces the placeholder rather than sitting beside it.

## Alternatives Considered

1. Leave the name unclaimed until the first real release
1. Publish the real package now, before the repository is public
