# 022: Interview servers enforce same-origin and own their process lifecycle

- **Date**: 2026-08-04
- **Status**: accepted
- **Tags**: architecture
- **Author**: rule-mcp-architect

## Context

Security audit 2026-08-04 found two architect interview servers (skills/rule-architect/assets/context-server.mjs and skills/rule-architect-web/server.mjs) bind loopback and deliberately send no CORS headers, which stops hostile page from READING their responses but not from SENDING requests: cross-origin POST with Content-Type text/plain is CORS simple request, so no preflight is issued and POST /api/generate runs - writing files into user's project and, with force:true, overwriting root files. Neither server validated Origin, Sec-Fetch-Site, or Host, leaving CSRF and DNS rebinding open. Separately, src/tools/architect.js spawned context server, resolved its promise on first URL line or after 5s timeout, and never killed child: every mode=interview call left another HTTP server listening with write access to project directory, outliving MCP server, while stdout listeners kept growing string nobody read. result was also cached, because rule-mcp-architect was absent from tool-cache denylist, so replay handed user dead ephemeral port and skipped spawn entirely.

## Decision

Add skills/rule-architect/http-guard.mjs - shared, pure checkLocalRequest()/denyForeignRequest() pair - and apply it to every /api/* request on both servers: Sec-Fetch-Site must be same-origin or none, Origin (when present) must be loopback origin on served port, Host must be loopback authority on served port. Browser-set headers cannot be forged by page script, so this closes CSRF and DNS rebinding without touching wizard UI or its duplicated interview.js copies. In src/tools/architect.js, track every child in registry keyed by target directory: second call for same target reuses running server instead of spawning another, listeners are detached once URL is found, captured output is capped at 64 KB, each server is killed after 30-minute lifetime, and exit/SIGINT/SIGTERM stop all of them. spawn uses process.execPath instead of PATH lookup for "node". rule-mcp-architect joins tool-cache denylist.

## Consequences

Non-browser clients (curl, tests) still reach API because they send neither Origin nor Sec-Fetch-Site - anything already executing code on loopback interface is outside this threat model. page served from another local port is treated as foreign, which is correct but means interview UI must be served by interview server itself. Reuse changes observable behavior: second mode=interview call for same directory returns existing URL instead of new one. Interview servers now die with MCP server rather than lingering, so user who wants one to outlive session must start it from CLI. Covered by test/architect-server-csrf.test.mjs and test/architect-interview-lifecycle.test.mjs.
