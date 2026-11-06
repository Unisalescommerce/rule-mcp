# 116: Make the tool-call host a list so invocation hosts coexist

- **Date**: 2026-09-28
- **Status**: accepted
- **Tags**: architecture, mcp, git, workflow
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

WS2 branch-sync guard needed to hang off tool-call path beside self-update. host port (`registerCallHost`) held one host object, so second registration replaced first and silently disabled throttled self-update check. seam that supports exactly one registrar is seam that makes every later feature regression.

## Decision

`registerCallHost` appends to list. `hostBeforeCall(name)` runs every registered host's `beforeCall` in registration order, and `hostBanner()` joins every host's banner with blank line. `resetCallHosts()` clears list for tests. Each host still registers itself at import time, so loading module is registration.

## Consequences

Two hosts coexist: self-update's throttled check and the branch-sync guard's staleness notice. A new host cannot evict an existing one. The cost is that every host is asked on every call, so a host must do cheap, deferred work - both do: each kicks a throttled, fire-and-forget check rather than computing inline. The pipeline still asks the port, never the modules, so the router stays at the bottom of no cycle.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. second, dedicated port for sync guard - breaks the 'one port' idea ARCH-1 established and leaves two seams to keep
1. Have pipeline import each host and call it directly - puts router back at top of cycle
1. Let last registrar win and merge hooks by hand - same eviction bug, deferred
