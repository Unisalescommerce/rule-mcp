# Plan: Pi integration and catalog debt

Status: `in-progress`.

Notes: subordinate plan.

Coordinated by [plan-of-plans](plan-of-plans.md).

This plan records work that had no file of its own.

It does not restate a catalog node.

## Dependency graph

```
WS1 --> WS2 --> WS3
```

Depends on: none.

Feeds: none.

Shared files: none.

WS1 runs first.

WS2 runs after WS1.

WS3 runs after WS2.

WS1 edits tool descriptions and three array schemas.

WS2 marks steps in the [bundler family plan](skills/toolchain/_bundler-family.md).

WS3 edits the handon check, the closeout writer, the [reference plan](_plan-of-plans-reference.md), and the lint finding.

### WS1 - Pi 1.5.0 tool contract

Pi 1.5.0 coerces a JSON Schema tool argument the way it coerces TypeBox.

Its search ranks a tool name above the description.

A query word still has to appear.

- [x] **WS1-T1**: Add the query words the descriptions lack.
- [x] **WS1-T1.1**: Name session, resume, close, and plan in the handoff and handon descriptions.
- [x] **WS1-T1.2**: Name verify, lint, guardrail, and decision in the check and gateway descriptions.
- [x] **WS1-T2**: Accept one item where a schema asks for an array.
- [x] **WS1-T2.1**: Coerce gateway files when the caller sends one object.
- [x] **WS1-T2.2**: Coerce ADR alternatives and tags when the caller sends one string.
- [ ] **WS1-T3**: Load one installed skill in pi.
- [ ] **WS1-T3.1**: Record whether a custom frontmatter key raises a skill warning.

### WS2 - Bundler family node

The three open steps already live in the [bundler family plan](skills/toolchain/_bundler-family.md).

This workstream does not copy them.

- [ ] **WS2-T1**: Carry out those three steps and mark them closed in that plan.
- [ ] **WS2-T2**: Confirm the cascade no longer lists that plan as ready.

### WS3 - Known debt

- [ ] **WS3-T1**: Resolve a pending ADR span to its real path before the handon check.
- [ ] **WS3-T2**: Keep each closed step whole when the closeout writes the Outcome.
- [ ] **WS3-T3**: Keep plan prose that is not a checkbox in that Outcome.
- [ ] **WS3-T4**: Close F4, F5, F8, F9, and the stage list in the reference plan.
- [ ] **WS3-T5**: Clear the documentation comment lint failure, or record why it stays.

See the [closeout archive](../../packages/mcp/tools/handoff/_closeout-archive.js).

See the [handon check](../../packages/mcp/tools/handon/_verify.js).
