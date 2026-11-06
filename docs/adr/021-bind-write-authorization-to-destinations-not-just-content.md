# 021: Bind write authorization to destinations, not just content

- **Date**: 2026-08-04
- **Status**: accepted
- **Tags**: architecture
- **Author**: rule-mcp-architect

## Context

Security audit 2026-08-04 (findings retired; decisions are recorded here and in ADRs 030-044) found that rule_tool_apply, only tool that writes files, anchored its path-traversal check to caller-supplied `path` argument. call with path:"/" made every destination "inside project", so guard could not fail. Containment was pure path.resolve string math, so symlinked directory inside real project escaped it. Separately, rule_tool_gateway receipt hashed only concatenated file contents joined with in-band "\n---FILE---\n" separator: it never covered file paths (receipt earned for benign code authorized writing that code to .git/hooks/pre-commit) and separator made [{a:"X\n---FILE---\nY"}] collide with [{a:"X"},{b:"Y"}]. Guardrails validated WHAT was written and nothing about WHERE.

## Decision

Split write authorization into validated root, validated destination, and path-bound receipt. resolveProjectRoot() refuses filesystem root, home directory, and system directories (temp dirs stay allowed for scaffolding). resolveWriteTarget() refuses absolute paths,.. traversal, NUL bytes, destinations that grant code execution or hold credentials (.git,.ssh,.gnupg,.agents,.claude, node_modules, shell rc files, key files), and escapes proven by realpath on deepest existing ancestor rather than by string comparison. rule_tool_gateway accepts optional `files` array and issues receipt over canonicalFilesDigest(files) - length-prefixed digest of ordered (path, content) tuples. Receipts record their binding ("files" or legacy "content") and two are not interchangeable: validateReceipt refuses path-bound token, and content-only receipt can only authorize single-file write.

## Consequences

Multi-file writes now need passing `files` to rule_tool_gateway; bare `code` string cannot describe more than one destination and is limited to legacy single-file flow. Writes into.git/,.ssh/,.claude/,.agents/ and shell rc files are refused regardless of guardrail outcome, so any workflow that legitimately needs them must use different mechanism. arbitrary project root remains writable by design - that is what tool is for - so residual risk is scoped to project trees caller already names. Digest changes invalidate in-flight receipts, which is harmless given 5-minute TTL and in-memory store. Covered by test/apply-containment.test.mjs and test/gateway-receipt-paths.test.mjs.
