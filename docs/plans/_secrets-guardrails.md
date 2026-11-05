# Plan: secrets guardrails - betterleaks gate and deterministic checks

Status: `planned`.

Notes: subordinate plan.

Coordinated by [plan-of-plans](plan-of-plans.md).

This plan integrates the detection algorithms of `betterleaks/betterleaks` (MIT,
Go) into the two places rule-mcp can actually enforce them: the git gate that
runs before a commit, and the deterministic checks `rule_tool_check` answers
with.

It extends the `secret-detection` rule that the
[devops router plan](skills/devops/_rule-mcp-devops.md) keeps, and it adds no
new skill.

## Evidence base

Audited read-only in the session that wrote this plan:

- `skills/rule-devops/guardrails/_secret-detection.js` - one regex over
  `password|secret|apiKey|token`, no entropy, no provider prefix, no wordlist.
- `packages/mcp/cli/guard/_staged.js` - the commit gate runs `checkCode` over
  staged files whose extension is in `CHECKABLE` (`.js .mjs .cjs .jsx .ts .tsx
.vue .svelte .astro .css .sql .prisma`). `.env`, `.yml`, `.json`,
  `Dockerfile` and lockfiles are never read.
- `packages/mcp/core/guardrails/engine/_registry.js` - `rule-devops` is not a
  baseline skill, so its rules run only when a caller names a `rule-devops*`
  skill.
- `packages/mcp/core/guardrails/project/_run.js` - the fail-soft precedent: a
  check whose tool cannot answer is skipped, never failed.
- `packages/mcp/core/guardrails/__tests__/_scores.fixture.mjs` - the promotion
  gate: 100% precision and recall per rule on the labeled corpus in
  `scripts/__tests__/fixtures/guardrail-corpus.mjs`.
- `betterleaks` v2 (main), MIT, (c) 2026 Zachary Rice. Default config: 474
  rules, 654 KB TOML. Engine order: prefilter, Aho-Corasick keywords, re2,
  decode passes, post-match filter, then optional HTTP validation.
- Algorithms worth taking, all offline and deterministic:
  `internal/exprruntime/bindings_filter.go` (`shannonEntropy`,
  `failsTokenEfficiency`), `internal/tokenizer` (cl100k_base BPE, 775 KB gz
  asset), `internal/words` (NLTK list, 94 KB gz), `scan/assignment_guard.go`.
- Pre-commit flow published upstream:
  `git diff --cached --no-ext-diff --no-textconv --no-color --src-prefix=a/ --dst-prefix=b/ | betterleaks stdin --git-diff --redact`.

## Dependency graph

```
WS1 --> WS3
WS2 --> WS3
```

Depends on: none.

Feeds: none.

Shared files: `skills/rule-devops/guardrails/index.js`,
`packages/mcp/cli/guard/_staged.js`.

WS1 and WS2 are independent and may run in either order.

WS3 runs after both, because the ADR records what actually shipped.

WS1 adds a binary dependency and touches the hooks, the CLI and CI.

WS2 adds pure JavaScript checks and touches the rule-devops rule set.

WS3 writes the ADR, the determinism policy and the census.

### WS1 - betterleaks as the git gate

The gate answers one question: does the patch about to be committed add a
credential. It never validates, never analyzes and never revokes - those three
stages make an HTTP request, and a guardrail that needs the network is not a
guardrail.

- [x] **WS1-T1**: Probe the binary once per process in
      `packages/mcp/core/secrets/_probe.js`: `betterleaks --version` with a 1 s
      timeout and `SIGKILL`, returning `{ available, version, reason }` and
      never throwing.
- [x] **WS1-T1.1**: Test the probe against a stub binary on `PATH`, an absent
      binary and a launcher whose target moved.
- [x] **WS1-T2**: Run the scan in `packages/mcp/core/secrets/_betterleaks.js`:
      `git diff --cached --no-ext-diff --no-textconv --no-color` piped into
      `betterleaks stdin --git-diff --redact --no-banner --output=json`, 10 s
      timeout, 4 MiB buffer, JSON array parsed into
      `{ ruleId, file, line, redactedMatch }`. No `-v`, no `-a`, no
      `revoke`.
- [x] **WS1-T2.1**: Test a recorded findings fixture, and test that a timeout
      and a non-zero exit are reported as "not scanned", never as clean.
- [x] **WS1-T3**: Add `secretFailures()` to
      `packages/mcp/cli/guard/_staged.js`, covering every staged file with no
      extension filter, and merge it into the reason `decide()` asks with.
- [x] **WS1-T4**: Add the `rule-mcp secrets` CLI (`--staged` default,
      `--range A..B`, `--repo`, `--json`): exit 1 on findings, exit 0 with a
      loud skip line when the binary is absent.
- [x] **WS1-T5**: Install a `pre-commit` hook in `.githooks/` and in
      `scripts/install/git-hooks/` that runs the staged scan; pre-push keeps
      commit messages and formatting.
- [x] **WS1-T6**: Add the CI job that runs `rule-mcp secrets --range` over the
      commits a branch adds.
- [x] **WS1-T7**: Document the policy in `SECURITY.md`: scans are offline,
      `--redact` is unconditional, the binary version is pinned, the ignore file
      is versioned and reviewed.

### WS2 - deterministic checks without the binary

The checks answer the other question: is the code the model is writing right now
holding a credential. They run inside `rule_tool_check`, offline, with no
dependency to install.

- [ ] **WS2-T1**: Port `shannonEntropy` into
      `skills/rule-devops/guardrails/_secret-entropy.js`.
- [ ] **WS2-T2**: Port `internal/tokenizer` and `internal/words` into
      `_secret-token-rarity.js`: the cl100k_base counter, the NLTK list and the
      `failsTokenEfficiency` thresholds (reject on a 5-letter dictionary word,
      otherwise `chars/tokens >= 2.5`, or `>= 2.1` under 12 characters with a
      4-letter word). Assets vendored with a `LICENSES/` entry, loaded lazily
      and cached.
- [ ] **WS2-T2.1**: Test the port against betterleaks' own vectors
      (`internal/tokenizer/tokenizer_test.go`), including the multi-byte and
      repeated-character cases.
- [ ] **WS2-T3**: Add `_secret-known-pattern.js`: a curated subset of provider
      patterns (regex plus mandatory keyword) transcribed from
      `config/betterleaks.toml`, with the MIT attribution in the file header.
- [ ] **WS2-T4**: Rebuild `_secret-detection.js` on top of T1 and T3, keeping
      the rule id: the corpus and the area plan depend on it.
- [ ] **WS2-T5**: Add the good/bad pairs to the corpus with
      `skill: "rule-devops"`, and make `_scores.fixture.mjs` report 100%
      precision and recall for every new rule id before any of them blocks.
- [ ] **WS2-T6**: Scope the rules to the files that carry credentials
      (`.env*`, `.yml`, `.json`, `Dockerfile`, `*.pem`, `*.key`) through
      `fileName`, so the checks fire where the gate cannot look.

### WS3 - governance and census

- [ ] **WS3-T1**: Record the decision with `rule_tool_process_adr`: the binary
      dependency, the offline-only policy, the promotion gate and what would end
      the integration.
- [ ] **WS3-T2**: Regenerate the census (`pnpm census`) for
      `docs/15-guardrails.md` and the README counts.
- [ ] **WS3-T3**: Register the plan row in `plan-of-plans.md` and in the devops
      area plan's evidence.

## Shipped in WS1-T5 to T7

- `.githooks/pre-commit` probes the launcher, runs `rule-mcp secrets`, and then
  keeps the census step it already had. Only exit 1 blocks: a scan that did not
  run (exit 2) is printed and stepped over, because a gate that blocks every
  commit until a tool is repaired teaches `--no-verify`.
  `RULE_MCP_HOOK_NO_SIDE_EFFECTS=1` skips the census, so the hook test measures
  an exit code without rewriting and staging documentation.
  `scripts/__tests__/hooks/pre-commit-secrets.test.mjs` pins the three exits, and
  `repo-hooks-fallback.test.mjs` now covers this hook's probe.
- `.github/workflows/ci.yml` gains a `secrets` job: betterleaks v2 pinned to
  `2.0.0-rc.7`, verified against a repository-pinned SHA-256 digest before use.
  PR scans use base/head event SHAs; push scans use before/after event SHAs.
  New branches, manual runs and missing old tips scan reachable history.
  The job verifies the binary version before invoking the scanner.
- `SECURITY.md` carries the policy: offline, redacted, pinned, bounded and
  fail-soft.

## Security regression corrections

- [x] Explicitly disable provider validation and analysis, including environment overrides.
- [x] Scan individual commit patches with `git log -p`, including roots and merge patches.
- [x] Reject option-shaped revisions and incomplete scan reports.
- [x] Fix event range selection and pin the CI asset digest in the repository.
- [x] Exempt non-UI Node tests from the browser accessibility requirement.
- [x] Verify a synthetic credential added and removed in intermediate commits with the real v2 binary.

Validation: 409 tests passed, one skipped; smoke tests passed. The updated MCP
server passed `rule_tool_check` for all 25 changed JavaScript files.

## Verified against the real binary

Run in the session that wrote WS1, with binaries downloaded to a temporary
directory and never installed:

- v1.10.0, the current stable, prints `betterleaks version 1.10.0`; the probe
  reports `available: true, major: 1, supported: false` and the gate refuses it
  with "the gate speaks v2 (stdin --git-diff)". A stable release is therefore
  not enough to run this gate: WS1-T5 and WS1-T7 must pin the v2 release
  candidate, and the install instructions must say so.
- v2.0.0-rc.7, piped a staged patch that adds a GitHub PAT, wrote
  `{"schema_version": "1", "findings": [...], "scan": {...}}` on stdout and its
  log lines on stderr, redacted the match as `REDACTED`, and exited 0 under
  `--exit-code=0`. `parseReport` read it, `scanStaged` returned one
  `github-pat` finding at `config.js:2`, `rule-mcp secrets` exited 1, and the
  guard hook answered `git commit` with `permissionDecision: "ask"` naming the
  rule and the place.

## Out of scope

- The Expr runtime and the 474-rule TOML. Porting an expression interpreter to
  reuse a rule set we would still have to pin buys nothing.
- `validate`, `analyze` and `revoke`. All three make HTTP requests.
- The remote sources (`github`, `gitlab`, `huggingface`, `s3`, `container`,
  `web`). The gate reads the local patch only.
- A one-off history audit (`betterleaks git .`). Useful, but it is a run, not a
  guardrail, and it belongs in a release checklist.
