# 023: Pin the self-update remote and drop root in the container

- **Date**: 2026-08-04
- **Status**: accepted
- **Tags**: architecture
- **Author**: rule-mcp-architect

## Context

Security audit 2026-08-04 findings 06 and 07. (06) forced self-update runs on every tool invocation: git fetch, git merge --ff-only @{u}, skill hot-reload, and scheduled process.exit(0) so supervisor restarts into new code. It verified nothing about source - no remote allowlist, no signature check. Anyone able to write one line into .git/config (dependency postinstall, shared machine, a.git baked into image) obtained code execution in MCP server at next tool call with no user interaction; upstream repository compromise had same effect on every install at once. git merge also runs repository-provided hooks when core.hooksPath points inside tree, as it does in this repo. (07) docker-compose.yml published port as "37999:37999", which binds host's 0.0.0.0 and turned container's deliberate RULE_MCP_HOST=0.0.0.0 into LAN exposure with bearer token as only barrier and no lockout on failed auth; image ran as root on mutable base tag with dependency install scripts enabled.

## Decision

Verify update source before any network or merge operation. normalizeRemoteUrl() reduces remote to host+path (scheme, credentials, port,.git suffix and trailing slash removed) so scp-style SSH remote this repo uses compares equal to HTTPS URL server.json declares. resolveAllowedRemotes() trusts repository declared in shipped server.json, replaced entirely by RULE_MCP_UPDATE_REMOTE (comma-separated) for forks and test sandboxes; there is deliberately no trust-on-first-use fallback, which would trust whoever edited .git/config first. remote that does not match yields reason "remote-not-allowed" with loud banner and no fetch. RULE_MCP_UPDATE_REQUIRE_SIGNATURE=1 also needs git verify-commit on upstream commit; it is opt-in because most repositories do not sign and failing closed by default would silently stop every update. Applied updates now write remote and commit range to stderr. For container: docker-compose publishes 127.0.0.1:37999:37999, Dockerfile adds USER node before CMD, installs with --ignore-scripts, and sets RULE_MCP_DOCKER=1 so detectInstallType() refuses git self-update inside image.

## Consequences

Forks and any clone whose remote is not declared repository stop auto-updating until RULE_MCP_UPDATE_REMOTE is set - deliberate fail-closed change, surfaced through banner and rule_tool_update rather than silence. remote check precedes dirty-tree check, so repointed remote is reported even when tree is dirty; sandboxed tests had to declare their own upstream, and test/self-update.test.mjs plus test/self-update-throttle.test.mjs were updated accordingly. Auto-apply remains forced: pinning remote closes local .git/config vector, while upstream compromise is only mitigated by enabling signature verification - making auto-apply opt-in would change documented product promise and is left as open decision. base image is still referenced by tag: no digest was resolvable in environment that made this change and inventing one would be worse than none. Covered by test/self-update-remote-pin.test.mjs and test/docker-hardening.test.mjs.
