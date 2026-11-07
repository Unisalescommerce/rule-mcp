# 247: The wizard asks its questions as prompts when the renderer cannot run

- **Date**: 2026-11-07
- **Status**: accepted
- **Tags**: wizard, runtime, cli
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The full-screen wizard is OpenTUI, whose native core loads node:ffi. That builtin exists from Node 26.1, so on Node 24 createCliRenderer throws and no flag can help: import('node:ffi') answers ERR_UNKNOWN_BUILTIN_MODULE. Until now the whole setup flow was skipped below the renderer floor, and a Node 24 user could only install from flags.

## Decision

The flow talks to a six-method port - setStep, ask, askPath, confirm, progress, close - and the renderer is one adapter behind it. A second adapter answers the same port with @clack/prompts, which needs no FFI, and the mount picks it when canRenderWizard() is false but the terminal can still answer. canRunPlainWizard gates a terminal alone, so interactive no longer depends on the renderer's version floor.

## Consequences

A Node 24 terminal gets the same questions, defaults and review as the full-screen wizard, printed as prompts. The renderer keeps its floor, so nothing can mount a frame that cannot draw. The flow is now covered by two adapters, and every step test runs without a terminal.

## What would end this

OpenTUI ships a backend that runs without node:ffi, or the prompts and the frame drift apart in the questions they ask.

## Alternatives Considered

1. Keep the flag-only path on Node 24: cheapest, and it makes the documented installer ask nothing on a runtime that runs every tool.
1. Drop OpenTUI and use the prompts everywhere: one path to maintain, and it loses the full-screen frame, the rail and the mouse selection.
1. Ship a bundled Node 26 with the installer: a second runtime to keep patched, for one screen.
