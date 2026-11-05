# Session handoff: security gate and runtime cleanup

Branch: `rel/v0.1.0`  
Commit range: `75b013ab9..4077e0bf`  
Date: 2026-11-05

## Completed

- Added the Betterleaks v2 staged-patch and commit-history scanner, CLI, local hook and CI job.
- Explicitly disabled provider validation and analysis, rejected incomplete reports, and pinned the CI binary checksum.
- Removed the former optional gateway from the MCP runtime. Deterministic routing remains available.
- Corrected the accessibility guardrail for non-UI Node tests.
- Pinned workspace dependency versions and updated the lockfile.
- Rewrote local branch and tag history as requested. Remote-tracking refs and `refs/original` were not rewritten. No push was performed.

## Verification and risks

- The focused runtime and security suite passed 255 tests. `pnpm test` and `pnpm census:check` passed.
- Betterleaks was absent from PATH during the commits; the local hook reported a skipped scan and did not block.
- Git history and dirty worktree backup: `/tmp/rule-mcp-history-backup.ot1VFb`. This temporary backup retains the old history.
- CI workflow changes have not been verified in a remote run.
- The repository still contains former gateway references outside the MCP runtime. Local models have not been integrated. The local server listed Laya and Kev, but not Jev.
- Native secret-detection checks remain open in `docs/plans/_secrets-guardrails.md`.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace. Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The ADR log and the context snapshot capture what has been decided; do not re-ask answered questions.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.
Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
Read `docs/handoff/49-security-gate-and-runtime-cleanup.md`. First inspect the remaining former gateway references outside the MCP runtime and verify the local model contracts before proposing replacements.
```
