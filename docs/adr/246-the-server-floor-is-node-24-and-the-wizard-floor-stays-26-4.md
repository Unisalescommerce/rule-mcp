# 246: The server floor is Node 24, and the wizard floor stays 26.4

- **Date**: 2026-11-07
- **Status**: accepted
- **Tags**: runtime, install, wizard
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

One constant, NODE_FLOOR = 26.4.0, gated the server start, the preflight row, the doctor and the four bootstrap scripts. Its reason was OpenTUI's native core, which loads node:ffi and needs 26.1 or newer. The server never loads the renderer: bin/rule-mcp.js imports it only when a terminal mounts the wizard. A Node 24 host therefore ran every tool and printed the same plan from the flags, and the floor refused it anyway.

## Decision

Two floors, two readers. NODE_FLOOR is 24.0.0 and gates the server start, the preflight row, the doctor and the four bootstrap scripts. WIZARD_FLOOR is 26.4.0 and gates canRenderWizard, which already fell back to the flag path below it. The full suite runs on Node 24.22.1 and on 26.12.1, and the CI test job carries both in its matrix, so neither floor is a claim nobody checks.

## Consequences

Node 24 hosts install and run the server, and get the flag-driven setup instead of the full-screen wizard. The renderer keeps its own floor, so a 24 user is never handed a wizard that cannot mount. The two floors are now separate constants and separate tests, and the CI matrix pays for one more run per OS.

## What would end this

The server starts importing the renderer on its own path, or a Node 24 API the server needs turns out to be missing, or OpenTUI ships a Node 24 backend.

## Alternatives Considered

1. Keep one floor at 26.4: simplest, and it refuses a runtime that runs every tool.
1. Drop the floor and let the wizard fail on mount: the failure comes from inside a .node binary and says nothing about Node.
1. Set the server floor to 26 as well but allow 24 by warning: a warning on every start is noise, and the version check exists to fail closed.
