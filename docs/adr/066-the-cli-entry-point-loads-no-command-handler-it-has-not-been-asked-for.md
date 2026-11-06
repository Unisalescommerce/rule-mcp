# 066: The CLI entry point loads no command handler it has not been asked for

- **Date**: 2026-09-09
- **Status**: accepted
- **Tags**: cli, startup, performance, imports
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

stdio starts server as subprocess per client, so startup is paid on every connect rather than once per machine. pnpm report:startup measured warm --help at 216 ms, of which 185 ms was static import graph: command registrars imported their handlers at module load, and handlers pull MCP server, both transports, installer and 105 tool registrations. NODE_COMPILE_CACHE was expected to cut 35 percent of that and measured 2-6 percent.

## Decision

Keep command and option declarations static, and load handlers inside their actions. declarations are what --help renders, so generated help still cannot drift from what parses; handler graph is what nothing but chosen command needs. entry also imports src/cli/_program.js directly instead of cli barrel, which also exported TUI and uninstaller. compiled code cache is enabled in bin/ before application graph loads, which is why that load is dynamic import: static one is hoisted above call.

## Consequences

Warm --help fell from 216 ms to 48 ms, and every command still dispatches. listTools() is memoized on registry generation bumped by register, clear and retain, so 105-schema conversion is paid once per process instead of once per tools/list. wall-time assertion would be flaky, so src/cli/**tests**/_startup-graph.test.mjs asserts property instead: heavy graph must stay unreachable from entry through static imports. Cost: new command must remember to defer its handler, and test is what enforces it.

## What would end this

The assumption this leans on, and the observation that would make it wrong.
