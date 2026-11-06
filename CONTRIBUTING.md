# Contributing

Thanks for helping with rule-mcp. The short version: small fixes
need no ceremony, structural change needs an ADR first.

## Prerequisites

- Node.js >= 20 (`node --version`)
- pnpm 11+ (`pnpm --version`; the exact version CI uses is `PNPM_VERSION`
  in `.github/workflows/ci.yml`)
- git

There is deliberately no `packageManager` field: the manifest guardrail
bans it, so the version is not pinned there.

## Setup

```bash
git clone https://github.com/pixu1980/rule-mcp.git
cd rule
pnpm install
```

This git root is the private workspace (`rule-mcp-workspace`). The
published npm package is `packages/mcp` (`rule-mcp`). The workspace lists
`packages/*` and nothing outside the checkout, so a clone installs on its own.

`pnpm install` runs `prepare`, which installs the git hooks from
`.githooks/` as shims into `.git/hooks/`. To install them on demand:
`pnpm hooks:install`. `pnpm hooks:check` fails when a clone is missing
them.

## Everyday commands

```bash
pnpm install          # dependencies (exact pins, frozen lockfile in CI)
pnpm test:all         # the whole suite - green before every pull request
pnpm lint             # eslint over bin/, packages/, scripts/__tests__/
pnpm format           # prettier check (fix with pnpm format:fix)
pnpm census:check     # generated catalog docs are current (fix with pnpm census)
rule-mcp doctor # health report for your machine
```

## How to contribute

1. Read `docs/README.md`, then the numbered handbook chapters relevant to
   your change (`docs/12-engineering-guides.md` first for process).
2. Open work is tracked in the issue tracker; plans inside the repo are
   deleted when fully executed or obsolete.
3. Small fixes: open the pull request directly.
4. Structural change: record an ADR in `docs/adr/` first - a structural
   pull request without one is sent back for it.
5. Keep prose English, American spelling.

Branches look like `feat/short-description` or `fix/short-description`.
Commits follow Conventional Commits **with a mandatory scope**:
`type(scope): subject` - the `commit-msg` hook rejects scope-less
subjects. The allowed types live in one place,
`scripts/build/commit-types/index.mjs`, and the hook, the PR-title
check and the commit-lint CI job all follow it. There is no `release`
type: version bumps use the `chore(release)` scope instead.

Use `pnpm release` to publish a version. It makes the annotated tag and pushes
it with `main`. [The release chapter](docs/08-release.md) tells each step.

There is no CLA and no DCO sign-off requirement. Inbound contributions are
licensed under the MIT License (`inbound = outbound MIT`, matching `LICENSE`
and `REUSE.toml`): by opening a pull request you agree that your contribution
is provided under that license.

## Response times

Issues are triaged within 2 business days; pull requests are reviewed within
7 business days (see MAINTAINERS.md). If a week passes with silence, a polite
ping on the issue is welcome.

## Triage

Every issue gets a label from this set: `bug`, `enhancement`,
`good first issue`, `needs-triage`, `help wanted`. New issues start at
`needs-triage` until a maintainer routes them. An issue with no activity
for 60 days gets a stale ping; 14 more silent days close it, and
a comment reopens it at any time.
