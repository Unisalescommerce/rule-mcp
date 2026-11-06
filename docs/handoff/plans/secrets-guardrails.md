# secrets-guardrails

- **Plan**: `docs/plans/_secrets-guardrails.md` (retired)
- **ADR**: 212 (`203-close-out-plan-secrets-guardrails.md`)

## Delivered

- WS1-T1: Probe the binary once per process in
- WS1-T1.1: Test the probe with injected process responses for a
- WS1-T2: Run the scan in packages/mcp/core/secrets/_betterleaks.js:
- WS1-T2.1: Test a recorded findings fixture, and test that a timeout
- WS1-T3: Add secretFailures() in
- WS1-T4: Add the rule-mcp secrets CLI (staged by default,
- WS1-T5: Install a pre-commit hook in .githooks/ and in
- WS1-T6: Add the CI job that runs rule-mcp secrets --range over the
- WS1-T7: Document the offline provider-check policy in SECURITY.md:
- WS2-T1: Port shannonEntropy into
- WS2-T2: Port internal/tokenizer and internal/words into
- WS2-T2.1: Test the port against betterleaks' own vectors
- WS2-T3: Add _secret-known-pattern.js: a curated subset of provider
- WS2-T4: Rebuild _secret-detection.js on top of T1 and T3, keeping
- WS2-T5: Add good/bad pairs to the corpus and verify the existing
- WS2-T6: Cover .env*, .yml, .json, Dockerfile, *.pem,
- WS3-T1: Record the decision with rule_tool_process_adr: the binary
- WS3-T2: Regenerate the census (pnpm census) for
- WS3-T3: Register the plan row in plan-of-plans.md and in the devops
- Explicitly disable provider validation and analysis, including environment overrides.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
