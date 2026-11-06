# 042: Round-2 hardening - cycles, daemon/commands split, diagnostics, HTTP verification

- **Date**: 2026-08-25
- **Status**: accepted
- **Tags**: refactor, cycles, daemon, doctor, transport, logs, quality
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

second deep pass (health analytics + import-graph review) found: two real
module-init cycles (`skills.js` ⇄ `skill.js` via scaffold parsers, `skills.js`
⇄ `ai.js` via skill metadata), two remaining hotspot modules (`src/cli/daemon.js`
879 lines, `src/cli/commands.js` 818 lines with 5 KB help template), some
dead exports, doctor that did not report live surface, and unverified
claim about transports.

## Decision

1. **Break init cycles**: `getSkillMetadata` moved into skill store
   (`tools/router.js`) with frontmatter parser extracted to neutral
   `src/core/skill-frontmatter.js`; scaffold section parsers moved to a
   neutral `src/core/scaffold-parser.js`. `skills.js` re-exports moved
   names, so no import path changes.
2. **Split hotspots**: `src/cli/daemon-platform.js` = platform service
   writers (macOS LaunchAgent, systemd, Windows) + wrapper script;
   `src/cli/daemon.js` keeps orchestrators. `src/cli/help-text.js` = the
   usage text; `src/cli/commands.js` keeps dispatchers. Re-exports keep
   historical import paths (`generateWrapperScript`, module URL imports).
3. **Dead code**: removed unused `annotateTokensave`, `_resetForTests`.
4. **Diagnostics**: `doctor` now reports `version`, and live surface
   (tools/resources/prompts/skills counts) via best-effort probe;
   `daemon start` rotates log past 5 MB (`daemon.log → daemon.log.1`).
5. **Transports**: verified SDK-based Streamable HTTP transport
   (`serve --transport http`, spec 2025-06-18, bearer + session) with its
   existing `test/http.test.mjs` coverage and aligned stale `daemon.test`
   status assertions to `daemonProcessStatus` (T8 group).

## Consequences

**Positive**: runtime init cycles eliminated (no TDZ surprises); each hotspot
is now reviewable unit; doctor doubles as health snapshot; logs never grow
without bound; transport claim is covered by tests. Suite 212/212, lint +
prettier clean.
**Negative**: two more indirection layers when tracing install/daemon flow
(mitigated by re-export entry points); dependency-graph still shows hub
SCC (router/skills/tool-cache init glue) that is artifact of documented
hub pattern, tracked as future work.
