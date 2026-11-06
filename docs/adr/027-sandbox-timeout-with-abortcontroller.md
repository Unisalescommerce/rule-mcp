# 013 - Sandbox timeout with AbortController

- **Status:** accepted
- **Date:** 2026-07-19
- **Tags:** architecture, security
- **Author:** Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

withTimeout() returned error to caller but underlying Promise continued execution. Possible completion after timeout.

## Decision

withTimeout() now uses AbortController to cancel ongoing operation when timeout fires.

## Consequences

No pending operations after timeout. Resources properly freed.

## Alternatives Considered

- Ignore problem (rejected)
- Use clearTimeout without abort (insufficient)
